

class Navbar extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['active'];
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const active = this.getAttribute('active') || 'home';
    const tabs = {
      home: { color: "#a3b565", text: "#fdf8e2", icon: "home-icon.png", hoverIcon: "home-icon-hover.png" },
      profile: { color: "#504e76", text: "#fdf8e2", icon: "profile-icon.png", hoverIcon: "profile-icon-hover.png" },
      popular: { color: "#f1642e", text: "#fdf8e2", icon: "popular-icon.png", hoverIcon: "popular-icon-hover.png" },
      discover: { color: "#f1b02e", text: "#fdf8e2", icon: "discover-icon.png", hoverIcon: "discover-icon-hover.png" }
    };
    const pageColor = tabs[active]?.color || "#83c578";
    
    this.classList.add('navbar-wrapper');
    this.style.setProperty('--page-color', pageColor);
    this.innerHTML = `
    <div class="navbar">
      ${this.tab("home", "home.html", tabs.home.color, tabs.home.text, tabs.home.icon, tabs.home.hoverIcon, active)}
      ${this.tab("profile", "profile.html", tabs.profile.color, tabs.profile.text, tabs.profile.icon, tabs.profile.hoverIcon, active)}
      ${this.tab("popular", "popular.html", tabs.popular.color, tabs.popular.text, tabs.popular.icon, tabs.popular.hoverIcon, active)}
      ${this.tab("discover", "discover.html", tabs.discover.color, tabs.discover.text, tabs.discover.icon, tabs.discover.hoverIcon, active)}
    </div>
    `;
    this.attachIconHoverListeners();
  }

    tab(id, href, color, textColor, icon, hoverIcon, active) {
    const checked = id === active ? "checked" : "";
    return `
      <input type="radio" name="nav" id="${id}" ${checked}>
      <a href="${href}">
        <label class="navtab" style="--tab-color:${color}; --text-color:${textColor}" data-icon="assets/${icon}" data-hover-icon="assets/${hoverIcon}">
          <span class="navicon">
            <img src="assets/${icon}" alt="${id} icon" width="20" height="20" class="tab-icon">
          </span>
          <span class="navtext poppins-extrabold">${id}</span>
        </label>
      </a>
    `;
  }

  attachIconHoverListeners() {
    const labels = this.querySelectorAll('.navtab');
    labels.forEach(label => {
      const img = label.querySelector('.tab-icon');
      if (!img) return;
      const hoverIcon = label.dataset.hoverIcon;
      const normalIcon = label.dataset.icon;
      
      label.addEventListener('mouseenter', () => {
        img.src = hoverIcon;
      });
      label.addEventListener('mouseleave', () => {
        img.src = normalIcon;
      });
    });
  }
};

customElements.define('nav-bar', Navbar);
