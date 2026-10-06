import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const PROFILE_BUCKET = 'Profile_Images';

/**
 * Service to handle profile image uploads and storage in Supabase 'Profile_Images' bucket
 */
export const storageService = {
  /**
   * Upload an image file to Supabase Storage 'Profile_Images' bucket
   * @param {File|Blob} file - The image file to upload
   * @param {string} userId - Optional user ID or employee ID to prefix filename
   * @returns {Promise<{ publicUrl: string, filePath: string }>}
   */
  async uploadProfileImage(file, userId = 'user') {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client is not configured with valid credentials in .env');
    }

    if (!file) {
      throw new Error('No image file selected for upload');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Selected file must be an image (PNG, JPG, WEBP, etc.)');
    }

    // Limit size to 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('Image size must be less than 5MB');
    }

    try {
      // Determine file extension
      const fileExt = file.name ? file.name.split('.').pop().toLowerCase() : 'jpg';
      const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${cleanUserId}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to bucket 'Profile_Images'
      const { data, error } = await supabase.storage
        .from(PROFILE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/jpeg',
        });

      if (error) {
        // Check for common RLS / AccessDenied error
        if (
          error.message?.includes('row-level security') ||
          error.statusCode === '403' ||
          error.statusCode === 403 ||
          error.code === 'AccessDenied'
        ) {
          throw new Error(
            `Supabase Storage RLS Error: Bucket "${PROFILE_BUCKET}" requires an INSERT policy in Supabase. Please run the SQL command to enable public uploads.`
          );
        }
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(PROFILE_BUCKET)
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) {
        throw new Error('Failed to retrieve public URL from Supabase Storage');
      }

      return {
        publicUrl,
        filePath: data?.path || filePath,
      };
    } catch (err) {
      console.error(`Error uploading to ${PROFILE_BUCKET}:`, err);
      throw err;
    }
  },

  /**
   * Upload profile image and directly update public.users record
   * @param {string} userId - User UUID
   * @param {File|Blob} file - Image file
   * @param {boolean} isCurrentUser - Whether this is the currently logged in user
   * @returns {Promise<{ publicUrl: string, user: object }>}
   */
  async updateUserAvatar(userId, file, isCurrentUser = false) {
    if (!userId) {
      throw new Error('User ID is required to update avatar');
    }

    // 1. Upload to Profile_Images bucket
    const { publicUrl, filePath } = await this.uploadProfileImage(file, userId);

    // 2. Update avatar_url in public.users table
    let updatedUser = null;
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('users')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update avatar_url in users table:', error);
        throw new Error('Image uploaded to bucket, but failed to update user profile in database.');
      }
      updatedUser = data;
    }

    // 3. If it's the currently logged in user, refresh local session & broadcast
    if (isCurrentUser) {
      try {
        const storedUser = localStorage.getItem('otd_current_user');
        const parsed = storedUser ? JSON.parse(storedUser) : {};
        const merged = {
          ...parsed,
          ...(updatedUser || {}),
          avatar_url: publicUrl,
        };

        localStorage.setItem('otd_current_user', JSON.stringify(merged));
        localStorage.setItem('corporate_system_auth_user', JSON.stringify(merged));

        window.dispatchEvent(new CustomEvent('user_session_update', { detail: merged }));
        window.dispatchEvent(
          new CustomEvent('otd_storage_update', { detail: { key: 'otd_current_user' } })
        );
      } catch (sessionErr) {
        console.warn('Failed to update local session storage for avatar:', sessionErr);
      }
    }

    return {
      publicUrl,
      filePath,
      user: updatedUser,
    };
  },
};
