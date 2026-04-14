(function() {
  'use strict';

  // Configuration — set window.nexxusWidgetConfig before loading this script
  var CONFIG = {
    baseUrl: (window.nexxusWidgetConfig && window.nexxusWidgetConfig.baseUrl) || 'https://live.huminic.app',
    slug: (window.nexxusWidgetConfig && window.nexxusWidgetConfig.slug) || 'serra-honda',
    orgName: (window.nexxusWidgetConfig && window.nexxusWidgetConfig.orgName) || 'Serra Honda',
    primaryColor: (window.nexxusWidgetConfig && window.nexxusWidgetConfig.primaryColor) || '#0d9488',
    personaName: (window.nexxusWidgetConfig && window.nexxusWidgetConfig.personaName) || 'Caroline'
  };

  // Prevent duplicate widgets
  if (document.getElementById('nexxus-widget-container')) return;

  // ── State ──────────────────────────────────────────────────
  var state = 'closed'; // closed | menu | iframe

  // ── SVG Icons ──────────────────────────────────────────────
  var SVG_CHAT = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var SVG_CLOSE = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var SVG_MSG = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var SVG_PHONE = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
  var SVG_SEND = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  var SVG_VIDEO = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>';
  var SVG_HEADER_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var SVG_CLOSE_SM = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var SVG_BACK = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>';

  // ── Helpers ────────────────────────────────────────────────
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function(k) {
        if (k === 'style' && typeof attrs[k] === 'object') {
          Object.keys(attrs[k]).forEach(function(sk) { node.style[sk] = attrs[k][sk]; });
        } else if (k === 'className') {
          node.className = attrs[k];
        } else if (k.indexOf('on') === 0) {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else {
          node.setAttribute(k, attrs[k]);
        }
      });
    }
    if (children) {
      if (typeof children === 'string') {
        node.textContent = children;
      } else if (Array.isArray(children)) {
        children.forEach(function(c) { if (c) node.appendChild(c); });
      } else {
        node.appendChild(children);
      }
    }
    return node;
  }

  function setHTML(node, html) {
    node.innerHTML = html;
  }

  // ── Container ──────────────────────────────────────────────
  var container = el('div', { id: 'nexxus-widget-container', style: {
    position: 'fixed',
    bottom: '0',
    right: '0',
    zIndex: '2147483647',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: '14px',
    lineHeight: '1.5',
    boxSizing: 'border-box'
  }});
  document.body.appendChild(container);

  // ── FAB Button ─────────────────────────────────────────────
  var fab = el('button', {
    id: 'nexxus-fab',
    'aria-label': 'Open chat widget',
    style: {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: CONFIG.primaryColor,
      color: '#ffffff',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      zIndex: '2147483647',
      outline: 'none',
      padding: '0'
    }
  });
  setHTML(fab, SVG_CHAT);

  fab.addEventListener('mouseenter', function() {
    fab.style.transform = 'scale(1.08)';
    fab.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.3)';
  });
  fab.addEventListener('mouseleave', function() {
    fab.style.transform = 'scale(1)';
    fab.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
  });

  container.appendChild(fab);

  // ── Dropdown Panel ─────────────────────────────────────────
  var panel = el('div', {
    id: 'nexxus-panel',
    style: {
      position: 'fixed',
      bottom: '90px',
      right: '24px',
      width: '320px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
      display: 'none',
      zIndex: '2147483647',
      opacity: '0',
      transform: 'translateY(8px)',
      transition: 'opacity 0.2s ease, transform 0.2s ease'
    }
  });
  container.appendChild(panel);

  // ── Menu Options Data ──────────────────────────────────────
  var options = [
    {
      label: 'Web Chat',
      desc: 'Chat with our AI assistant',
      icon: SVG_MSG,
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
      mode: 'chat'
    },
    {
      label: 'Instant Call Back',
      desc: 'Get a call back now',
      icon: SVG_PHONE,
      iconBg: '#ecfdf5',
      iconColor: '#059669',
      mode: 'voice'
    },
    {
      label: 'Contact Form',
      desc: 'Send us a message',
      icon: SVG_SEND,
      iconBg: '#fff7ed',
      iconColor: '#ea580c',
      mode: 'form'
    },
    {
      label: 'Two-Way Video',
      desc: 'Face-to-face with ' + CONFIG.personaName,
      icon: SVG_VIDEO,
      iconBg: '#faf5ff',
      iconColor: '#9333ea',
      mode: 'video'
    }
  ];

  // ── Build Menu View ────────────────────────────────────────
  function buildMenu() {
    panel.innerHTML = '';

    // Header
    var header = el('div', { style: {
      padding: '16px',
      backgroundColor: CONFIG.primaryColor,
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }});

    var headerLeft = el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' }});

    var headerIconWrap = el('div', { style: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255,255,255,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }});
    setHTML(headerIconWrap, SVG_HEADER_ICON);

    var headerText = el('div');
    var orgNameEl = el('p', { style: { margin: '0', fontWeight: '600', fontSize: '14px', lineHeight: '1.3' }}, CONFIG.orgName);
    var subText = el('p', { style: { margin: '0', fontSize: '12px', opacity: '0.7', lineHeight: '1.3' }}, 'Choose how to connect');
    headerText.appendChild(orgNameEl);
    headerText.appendChild(subText);

    headerLeft.appendChild(headerIconWrap);
    headerLeft.appendChild(headerText);

    var closeBtn = el('button', {
      'aria-label': 'Close widget',
      style: {
        background: 'none',
        border: 'none',
        color: 'rgba(255,255,255,0.7)',
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      onClick: function() { closeWidget(); }
    });
    setHTML(closeBtn, SVG_CLOSE_SM);
    closeBtn.addEventListener('mouseenter', function() { closeBtn.style.color = '#ffffff'; });
    closeBtn.addEventListener('mouseleave', function() { closeBtn.style.color = 'rgba(255,255,255,0.7)'; });

    header.appendChild(headerLeft);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // Options list
    var optList = el('div', { style: { padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }});

    options.forEach(function(opt) {
      var btn = el('button', {
        style: {
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          borderRadius: '12px',
          border: '1px solid #f3f4f6',
          backgroundColor: '#ffffff',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background-color 0.15s ease',
          outline: 'none',
          fontFamily: 'inherit',
          fontSize: 'inherit'
        },
        onClick: function() { handleOptionClick(opt.mode); }
      });

      btn.addEventListener('mouseenter', function() { btn.style.backgroundColor = '#f9fafb'; });
      btn.addEventListener('mouseleave', function() { btn.style.backgroundColor = '#ffffff'; });

      var iconWrap = el('div', { style: {
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        backgroundColor: opt.iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: '0',
        color: opt.iconColor
      }});
      setHTML(iconWrap, opt.icon);

      var textWrap = el('div');
      var labelEl = el('p', { style: { margin: '0', fontWeight: '500', fontSize: '14px', color: '#111827', lineHeight: '1.3' }}, opt.label);
      var descEl = el('p', { style: { margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280', lineHeight: '1.3' }}, opt.desc);
      textWrap.appendChild(labelEl);
      textWrap.appendChild(descEl);

      btn.appendChild(iconWrap);
      btn.appendChild(textWrap);
      optList.appendChild(btn);
    });

    panel.appendChild(optList);
  }

  // ── Build Iframe View ──────────────────────────────────────
  function buildIframe(mode) {
    panel.innerHTML = '';

    // Header for iframe mode
    var header = el('div', { style: {
      padding: '12px 16px',
      backgroundColor: CONFIG.primaryColor,
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }});

    var headerLeft = el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' }});

    var backBtn = el('button', {
      'aria-label': 'Back to menu',
      style: {
        background: 'none',
        border: 'none',
        color: 'rgba(255,255,255,0.7)',
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      onClick: function() { showMenu(); }
    });
    setHTML(backBtn, SVG_BACK);
    backBtn.addEventListener('mouseenter', function() { backBtn.style.color = '#ffffff'; });
    backBtn.addEventListener('mouseleave', function() { backBtn.style.color = 'rgba(255,255,255,0.7)'; });

    var modeLabels = { chat: 'Web Chat', voice: 'Instant Call Back', form: 'Contact Form' };
    var modeLabel = el('p', { style: { margin: '0', fontWeight: '600', fontSize: '13px' }}, modeLabels[mode] || 'Widget');

    headerLeft.appendChild(backBtn);
    headerLeft.appendChild(modeLabel);

    var closeBtn = el('button', {
      'aria-label': 'Close widget',
      style: {
        background: 'none',
        border: 'none',
        color: 'rgba(255,255,255,0.7)',
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      onClick: function() { closeWidget(); }
    });
    setHTML(closeBtn, SVG_CLOSE_SM);
    closeBtn.addEventListener('mouseenter', function() { closeBtn.style.color = '#ffffff'; });
    closeBtn.addEventListener('mouseleave', function() { closeBtn.style.color = 'rgba(255,255,255,0.7)'; });

    header.appendChild(headerLeft);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // Iframe
    var iframeSrc = CONFIG.baseUrl + '/p/' + CONFIG.slug + '?mode=' + mode;
    var iframe = el('iframe', {
      src: iframeSrc,
      style: {
        width: '100%',
        height: '480px',
        border: 'none',
        display: 'block',
        borderRadius: '0 0 16px 16px',
        backgroundColor: '#ffffff'
      },
      allow: 'microphone; camera; autoplay',
      title: modeLabels[mode] || 'Widget'
    });

    panel.appendChild(iframe);
  }

  // ── Option Click Handler ───────────────────────────────────
  function handleOptionClick(mode) {
    if (mode === 'video') {
      // Video opens in a new tab (Tavus needs its own window)
      var videoUrl = CONFIG.baseUrl + '/p/' + CONFIG.slug + '?mode=video';
      window.open(videoUrl, '_blank', 'noopener,noreferrer,width=1280,height=800');
      closeWidget();
      return;
    }
    // Chat, Voice, Form open in an iframe inside the panel
    state = 'iframe';
    buildIframe(mode);
  }

  // ── Show / Hide Logic ─────────────────────────────────────
  function showPanel() {
    panel.style.display = 'block';
    // Force reflow for animation
    panel.offsetHeight;
    panel.style.opacity = '1';
    panel.style.transform = 'translateY(0)';
  }

  function hidePanel() {
    panel.style.opacity = '0';
    panel.style.transform = 'translateY(8px)';
    setTimeout(function() {
      panel.style.display = 'none';
    }, 200);
  }

  function showMenu() {
    state = 'menu';
    buildMenu();
    showPanel();
    setHTML(fab, SVG_CLOSE);
  }

  function closeWidget() {
    state = 'closed';
    hidePanel();
    setHTML(fab, SVG_CHAT);
  }

  function toggleWidget() {
    if (state === 'closed') {
      showMenu();
    } else {
      closeWidget();
    }
  }

  fab.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleWidget();
  });

  // ── Close on outside click ─────────────────────────────────
  document.addEventListener('click', function(e) {
    if (state !== 'closed' && !container.contains(e.target)) {
      closeWidget();
    }
  });

  // ── Close on Escape key ────────────────────────────────────
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && state !== 'closed') {
      closeWidget();
    }
  });

})();
