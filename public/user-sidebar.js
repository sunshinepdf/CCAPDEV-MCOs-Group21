class UserSidebar extends HTMLElement {
    connectedCallback() {
        const params = new URLSearchParams(window.location.search);
        const currentUserId = (sessionStorage.getItem("currentUserId") || "").trim();
        const userId = params.get('id') || params.get('userId') || currentUserId;
        const db = (typeof window.mockDatabase !== 'undefined' && window.mockDatabase) ? window.mockDatabase : { users: [] };
        const user = (db.users || []).find(u => u && String(u.id) === String(userId)) || {
            id: userId,
            username: "Unknown",
            photo: "assets/placeholder.png",
            college: "",
            year: "",
            bio: ""
        };
        
        // Logic to check if the viewer IS the owner
        const isOwner = (String(userId) === String(currentUserId));
        const isEditPage = window.location.pathname.includes('edit-profile');

        this.innerHTML = `
            <div class="profile-sidebar card card--dark">
                <div class="profile-header">
                    <img src="${user.photo}" id="profile-avatar-img" class="profile-pic">
                    <h1 id="profile-name" class="poppins-extrabold">${user.username}</h1>
                    <p id="profile-major" class="poppins-regular">${user.college} | Batch ${user.year}</p>
                </div>
                
                <div class="profile-info">
                    <h4 class="poppins-bold">About</h4>
                    <p id="profile-bio" class="poppins-regular">${user.bio}</p>
                </div>

                ${isOwner && !isEditPage ? 
                    `<a href="/edit-profile?id=${user.id}" class="edit-btn">Edit Profile</a>` : ''}
                
                ${isEditPage ? 
                    `<button id="save-profile" class="save-btn">Save Changes</button>` : ''}
            </div>
        `;
    }
}
customElements.define('user-sidebar', UserSidebar);