export default function isMobile() {
    // Detect device type
    const userAgent =
        typeof window !== 'undefined' ? window.navigator.userAgent : '';

    // Check if the device is iPad or mobile
    if (
        /iPad|iPhone|iPod|Android/.test(userAgent) ||
        window.navigator.maxTouchPoints > 1
    ) {
        return true
    } else {
        return false
    }
}