const content_dir = 'contents/'
const config_file = 'config.yml'
const lang_file = 'lang.yml'
const section_names = ['home', 'about', 'education-experience', 'research-interests', 'publications', 'awards'];
const section_files = {
    'home': 'home',
    'about': 'about',
    'education-experience': 'education-experience',
    'research-interests': 'research-interests',
    'publications': 'publications',
    'awards': 'awards'
};

let currentLang = localStorage.getItem('lang') || 'zh';
let langData = { en: {}, zh: {} };

function getContentDir() {
    return currentLang === 'en' ? content_dir + 'en/' : content_dir;
}

function applyLang() {
    const data = langData[currentLang];
    if (!data) return;
    ['affiliation', 'location', 'motto', 'intro'].forEach(key => {
        const el = document.getElementById(key);
        if (el && data[key]) el.textContent = data[key];
    });
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const v = data[el.dataset.i18n];
        if (v) el.textContent = v;
    });
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
}

function loadMarkdown() {
    marked.use({ mangle: false, headerIds: false });
    const dir = getContentDir();
    section_names.forEach((name) => {
        const file = section_files[name] || name;
        fetch(dir + file + '.md')
            .then(response => response.text())
            .then(markdown => {
                const html = marked.parse(markdown);
                const el = document.getElementById(name + '-md');
                if (el) el.innerHTML = html;
            })
            .then(() => { if (window.MathJax) MathJax.typeset(); })
            .catch(() => {
                const fallback = currentLang === 'en' ? content_dir : content_dir + 'en/';
                if (fallback !== dir) fetch(fallback + file + '.md').then(r => r.text()).then(md => {
                    const el = document.getElementById(name + '-md');
                    if (el) el.innerHTML = marked.parse(md);
                }).catch(() => { });
            });
    });
}

function setLang(lang) {
    if (lang === currentLang) return;
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyLang();
    loadMarkdown();
}

window.addEventListener('DOMContentLoaded', () => {

    const navbarToggler = document.body.querySelector('.navbar-toggler');
    document.querySelectorAll('#navbarResponsive .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (navbarToggler && window.getComputedStyle(navbarToggler).display !== 'none') navbarToggler.click();
        });
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            setLang(btn.dataset.lang);
        });
    });

    fetch(content_dir + config_file)
        .then(response => response.text())
        .then(text => {
            const yml = jsyaml.load(text);
            Object.keys(yml).forEach(key => {
                try {
                    const el = document.getElementById(key);
                    if (el && key !== 'affiliation' && key !== 'location' && key !== 'motto' && key !== 'intro') el.innerHTML = yml[key];
                } catch (_) { }
            });
        })
        .catch(() => { });

    fetch(content_dir + lang_file)
        .then(response => response.text())
        .then(text => {
            langData = jsyaml.load(text);
            applyLang();
        })
        .catch(() => { });

    loadMarkdown();
});
