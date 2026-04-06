// Custom Alert System
var AlertModal = (function() {
    var modal = null;
    var pendingConfirm = null;

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

        var secondaryButton = document.createElement("button");
        secondaryButton.className = "modal-button poppins-regular";
        secondaryButton.textContent = "Cancel";
        secondaryButton.style.display = "none";
        secondaryButton.style.marginLeft = "10px";
        
        content.appendChild(icon);
        content.appendChild(message);
        content.appendChild(button);
        content.appendChild(secondaryButton);
        overlay.appendChild(content);
        document.body.appendChild(overlay);
        
        secondaryButton.addEventListener("click", function () {
            if (pendingConfirm) {
                var callback = pendingConfirm.onCancel;
                pendingConfirm = null;
                hide();
                if (typeof callback === "function") callback();
                return;
            }
            hide();
        });
        overlay.addEventListener("click", function(e) {
            if (e.target === overlay) {
                if (pendingConfirm) {
                    var callback = pendingConfirm.onCancel;
                    pendingConfirm = null;
                    hide();
                    if (typeof callback === "function") callback();
                    return;
                }
                hide();
            }
        });
        
        return {
            overlay: overlay,
            content: content,
            icon: icon,
            message: message,
            button: button,
            secondaryButton: secondaryButton
        };
    }

    function show(msg, type) {
        if (!modal) {
            modal = createModal();
        }

        pendingConfirm = null;
        modal.button.textContent = "OK";
        modal.button.onclick = hide;
        modal.secondaryButton.style.display = "none";
        
        modal.message.textContent = msg;
        modal.content.className = "modal-content " + type;
        
        if (type === "error") {
            modal.icon.innerHTML = '<svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="28" fill="#f44336"/><path d="M20 20 L40 40 M40 20 L20 40" stroke="white" stroke-width="4" stroke-linecap="round"/></svg>';
        } else {
            modal.icon.innerHTML = '<svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="28" fill="#4CAF50"/><path d="M15 30 L25 40 L45 20" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
        }
        
        modal.overlay.classList.add("show");
    }

    function confirm(msg, onConfirm, onCancel) {
        if (!modal) {
            modal = createModal();
        }

        pendingConfirm = {
            onConfirm: typeof onConfirm === "function" ? onConfirm : null,
            onCancel: typeof onCancel === "function" ? onCancel : null
        };

        modal.message.textContent = msg;
        modal.content.className = "modal-content error";
        modal.icon.innerHTML = '<svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="28" fill="#f59e0b"/><path d="M30 16 L30 34" stroke="white" stroke-width="4" stroke-linecap="round"/><circle cx="30" cy="42" r="2.5" fill="white"/></svg>';

        modal.button.textContent = "Delete";
        modal.secondaryButton.textContent = "Cancel";
        modal.secondaryButton.style.display = "inline-block";

        modal.button.onclick = function () {
            if (!pendingConfirm) {
                hide();
                return;
            }

            var callback = pendingConfirm.onConfirm;
            pendingConfirm = null;
            hide();
            if (typeof callback === "function") callback();
        };
        modal.overlay.classList.add("show");
    }

    function hide() {
        if (modal) {
            modal.overlay.classList.remove("show");
            modal.button.textContent = "OK";
            modal.secondaryButton.style.display = "none";
        }
    }

    return {
        show: show,
        confirm: confirm,
        hide: hide
    };
})();
