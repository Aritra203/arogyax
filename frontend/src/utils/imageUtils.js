/**
 * Utility function to validate and provide fallback for image URLs
 * @param {string} imageUrl - The image URL to validate
 * @param {string} type - Type of fallback image (doctor, patient, default)
 * @returns {string} - Valid image URL or fallback
 */
export const validateImageUrl = (imageUrl, type = 'default') => {
    // Check if image URL is valid
    if (!imageUrl || 
        imageUrl === '' || 
        imageUrl === 'data:;base64,=' || 
        imageUrl.startsWith('data:;base64,=') ||
        imageUrl.length < 10) {
        
        // Return appropriate fallback based on type
        switch (type) {
            case 'doctor':
                return 'https://via.placeholder.com/128x128/e0e7ff/6366f1?text=Dr';
            case 'patient':
                return 'https://via.placeholder.com/128x128/f3f4f6/6b7280?text=Patient';
            case 'avatar':
                return 'https://via.placeholder.com/64x64/f3f4f6/6b7280?text=User';
            default:
                return 'https://via.placeholder.com/100x100/f3f4f6/6b7280?text=Image';
        }
    }
    
    return imageUrl;
};

/**
 * Handle image load error events
 * @param {Event} event - The error event
 * @param {string} fallbackType - Type of fallback image
 */
export const handleImageError = (event, fallbackType = 'default') => {
    const fallbackUrl = validateImageUrl('', fallbackType);
    event.target.src = fallbackUrl;
    
    // Prevent infinite error loops
    event.target.onerror = null;
};

/**
 * Check if a base64 string is valid
 * @param {string} base64String - The base64 string to validate
 * @returns {boolean} - Whether the base64 string is valid
 */
export const isValidBase64 = (base64String) => {
    if (!base64String || typeof base64String !== 'string') {
        return false;
    }
    
    // Check for proper base64 format
    const base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)$/;
    return base64Regex.test(base64String);
};
