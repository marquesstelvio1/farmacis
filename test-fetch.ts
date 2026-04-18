console.log('Fetch is:', typeof fetch);
if (typeof fetch === 'function') {
    console.log('Fetch is available globally');
} else {
    console.log('Fetch is NOT available globally');
}
