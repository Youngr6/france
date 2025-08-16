document.addEventListener('alpine:init', () => {
    Alpine.data('tripApp', () => ({
        tripInfo: null,
        activities: null,
        loading: true,
        error: null,

        async init() {
            try {
                // For local development without a server
                if (window.location.protocol === 'file:') {
                    this.error = `This page needs to be served through a web server to work properly. 
                        Try one of these options:
                        1. Use 'python -m http.server' in the directory
                        2. Use 'npx serve' in the directory
                        3. Use VS Code's Live Server extension`;
                    this.loading = false;
                    return;
                }

                const [tripResponse, activitiesResponse] = await Promise.all([
                    fetch('./data/trip-info.json'),
                    fetch('./data/activities.json')
                ]);

                if (!tripResponse.ok) {
                    throw new Error('Failed to load trip-info.json. Status: ' + tripResponse.status);
                }
                if (!activitiesResponse.ok) {
                    throw new Error('Failed to load activities.json. Status: ' + activitiesResponse.status);
                }

                this.tripInfo = await tripResponse.json();
                const activitiesData = await activitiesResponse.json();
                this.activities = activitiesData.activities;
                this.loading = false;
            } catch (err) {
                this.error = 'Failed to load trip data: ' + err.message;
                this.loading = false;
                console.error('Error loading data:', err);
            }
        },

        getDayActivities(date) {
            return this.activities
                ?.filter(activity => activity.date === date)
                .sort((a, b) => {
                    // First sort by order number
                    if (a.order !== b.order) {
                        return a.order - b.order;
                    }
                    // If orders are equal, preserve original array position
                    return 0;
                }) || [];
        },

        getUniqueDates() {
            if (!this.activities) return [];
            return [...new Set(this.activities.map(activity => activity.date))].sort();
        },

        formatDate(dateString) {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: 'short'
            }).format(date).toUpperCase();
        },

        getActivityIcon(activity) {
            return activity.icon || 'fa-circle';  // fallback icon
        },

        formatNote(note) {
            // Convert URLs in text to clickable links
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            return note.replace(urlRegex, url => `<a href="${url}" target="_blank"><i class="fas fa-link me-1"></i>${url}</a>`);
        }
    }));
});
