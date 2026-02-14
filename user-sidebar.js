class UserSidebar extends HTMLElement {
    connectedCallback() {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('id') || "u1"; // Defaults to current user
        const user = mockDatabase.users.find(u => u.id === userId);
        
        // Logic to check if the viewer IS the owner
        const isOwner = (userId === CURRENT_USER_ID);
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
                    `<a href="edit-profile.html?id=${user.id}" class="edit-btn">Edit Profile</a>` : ''}
                
                ${isEditPage ? 
                    `<button id="save-profile" class="save-btn">Save Changes</button>` : ''}
            </div>
        `;
    }
}
customElements.define('user-sidebar', UserSidebar);