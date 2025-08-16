document.addEventListener('alpine:init', () => {
    Alpine.data('tripApp', () => ({
        tripInfo: null,
        activities: null,
        loading: true,
        error: null,
        expandedDays: {},

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

                // Get today's date for comparison
                const today = new Date().toISOString().split('T')[0];

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
                
                // Initialize expanded state for all days based on date
                const uniqueDates = [...new Set(this.activities.map(activity => activity.date))].sort();
                uniqueDates.forEach(date => {
                    // Expand if date is today or in the future
                    this.expandedDays[date] = date >= today;
                });

                this.loading = false;

                // After loading, scroll to current day if within trip dates
                this.$nextTick(() => {
                    if (this.isCurrentDayWithinTrip()) {
                        const dayElement = document.getElementById('day-' + today);
                        if (dayElement) {
                            dayElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                });
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
        },

        toggleDay(date) {
            this.expandedDays[date] = !this.expandedDays[date];
        },

        isDayExpanded(date) {
            return !!this.expandedDays[date];
        },

        isCurrentDay(date) {
            const today = new Date().toISOString().split('T')[0];
            return date === today;
        },

        isCurrentDayWithinTrip() {
            if (!this.tripInfo?.dates) return false;
            const today = new Date().toISOString().split('T')[0];
            return today >= this.tripInfo.dates.start && today <= this.tripInfo.dates.end;
        }
    }));
});
