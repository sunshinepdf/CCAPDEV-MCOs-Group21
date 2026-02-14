// Custom Alert System
var AlertModal = (function() {
    var modal = null;

    function createModal() {
        var overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        overlay.id = "alert-modal";
        
        var content = document.createElement("div");
        content.className = "modal-content";
        
        var icon = document.createElement("div");
        icon.className = "modal-icon";
        
        var message = document.createElement("p");
        message.className = "modal-message poppins-regular";
        
        var button = document.createElement("button");
        button.className = "modal-button poppins-regular";
        button.textContent = "OK";
        
        content.appendChild(icon);
        content.appendChild(message);
        content.appendChild(button);
        overlay.appendChild(content);
        document.body.appendChild(overlay);
        
        button.addEventListener("click", hide);
        overlay.addEventListener("click", function(e) {
            if (e.target === overlay) {
                hide();
            }
        });
        
        return { overlay: overlay, content: content, icon: icon, message: message, button: button };
    }

    function show(msg, type) {
        if (!modal) {
            modal = createModal();
        }
        
        modal.message.textContent = msg;
        modal.content.className = "modal-content " + type;
        
        if (type === "error") {
            modal.icon.innerHTML = '<svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="28" fill="#f44336"/><path d="M20 20 L40 40 M40 20 L20 40" stroke="white" stroke-width="4" stroke-linecap="round"/></svg>';
        } else {
            modal.icon.innerHTML = '<svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="28" fill="#4CAF50"/><path d="M15 30 L25 40 L45 20" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
        }
        
        modal.overlay.classList.add("show");
    }

    function hide() {
        if (modal) {
            modal.overlay.classList.remove("show");
        }
    }

    return {
        show: show,
        hide: hide
    };
})();
