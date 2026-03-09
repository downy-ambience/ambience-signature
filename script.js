document.addEventListener('DOMContentLoaded', () => {
  const fields = {
    firstname: document.getElementById('sig-firstname'),
    lastname: document.getElementById('sig-lastname'),
    title: document.getElementById('sig-title'),
    dept: document.getElementById('sig-dept'),
    country: document.getElementById('sig-country'),
    phone: document.getElementById('sig-phone'),
    email: document.getElementById('sig-email'),
    label: document.getElementById('sig-label'),
    logoUrl: document.getElementById('sig-logo-url'),
  };

  const preview = document.getElementById('signature-preview');
  const copyBtn = document.getElementById('btn-copy');
  const copyCodeBtn = document.getElementById('btn-copy-code');
  const toast = document.getElementById('toast');
  const logoThumb = document.getElementById('logo-preview-thumb');
  const logoLabel = document.getElementById('logo-preview-label');

  // ── Constants ──
  const WEBSITE = 'ambienceseoul.com';
  const ADDRESS = '1F, 28 Wonhyo-ro, Yongsan-gu, Seoul, South Korea 04383';
  const BRAND_BLUE = '#1a3cba';

  // ── Label → Logo Mapping ──
  // 각 레이블별 로고 경로와 표시 이름
  const LABEL_LOGOS = {
    'ambience': {
      url: 'assets/logo.png',
      name: 'Ambience 기본 로고',
      isSubLabel: false,
    },
    'the-pair-show': {
      url: 'assets/logo-the-pair-show.png',
      name: 'The Pair Show 로고',
      isSubLabel: true,
    },
    'bubble': {
      url: 'assets/logo-bubble.png',
      name: 'Bubble (Contents IP) 로고',
      isSubLabel: true,
    },
  };

  // ── Pre-load ALL label logos as base64 for clipboard copies ──
  const logoBase64Map = {};

  function preloadImage(url, callback) {
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Image not found');
        return res.blob();
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => { callback(reader.result); };
        reader.readAsDataURL(blob);
      })
      .catch(() => { callback(''); });
  }

  function preloadLogo(labelKey) {
    const logoInfo = LABEL_LOGOS[labelKey];
    if (!logoInfo) return;
    preloadImage(logoInfo.url, (base64) => { logoBase64Map[labelKey] = base64; });
  }

  // Pre-load all logos + wordmark on page load
  Object.keys(LABEL_LOGOS).forEach(preloadLogo);


  // ── Get current logo URL based on label + custom URL ──
  function getCurrentLogoUrl(forClipboard = false) {
    const customUrl = fields.logoUrl.value.trim();
    if (customUrl) return customUrl;

    const label = fields.label.value || 'ambience';
    if (forClipboard && logoBase64Map[label]) {
      return logoBase64Map[label];
    }
    return LABEL_LOGOS[label]?.url || LABEL_LOGOS['ambience'].url;
  }

  // ── Update logo preview thumb ──
  function updateLogoPreview() {
    const customUrl = fields.logoUrl.value.trim();
    const label = fields.label.value || 'ambience';
    const labelInfo = LABEL_LOGOS[label] || LABEL_LOGOS['ambience'];

    if (customUrl) {
      logoThumb.src = customUrl;
      logoLabel.textContent = '커스텀 로고';
    } else {
      logoThumb.src = labelInfo.url;
      logoLabel.textContent = labelInfo.name;
    }
  }

  // ── Phone Number Formatting ──
  function formatPhone(raw, countryCode) {
    // Strip all non-digit characters
    let digits = raw.replace(/\D/g, '');

    // Remove leading 0 (local format → international)
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }

    switch (countryCode) {
      case '+82': // Korea: 10-3397-1686
        if (digits.length === 10) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
        if (digits.length === 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
        return digits;
      case '+1': // US/Canada: (310) 555-1234
        if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        return digits;
      case '+44': // UK: 7911 123456
        if (digits.length === 10) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
        if (digits.length === 11) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
        return digits;
      case '+81': // Japan: 90-1234-5678
        if (digits.length === 10) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
        if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
        return digits;
      case '+86': // China: 138 0013 8000
        if (digits.length === 11) return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
        return digits;
      case '+65': // Singapore: 9123 4567
        if (digits.length === 8) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
        return digits;
      case '+61': // Australia: 412 345 678
        if (digits.length === 9) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
        return digits;
      case '+49': // Germany: 170 1234567
        if (digits.length >= 10) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        return digits;
      case '+33': // France: 6 12 34 56 78
        if (digits.length === 9) return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
        return digits;
      default:
        return digits;
    }
  }

  // ── Generate Signature HTML ──
  function generateSignatureHTML(data, forClipboard = false) {
    const name = data.firstname && data.lastname
      ? `${data.firstname} ${data.lastname}`
      : data.firstname || data.lastname || 'Downy Jung';
    const title = data.title || 'Producer';
    const dept = data.dept || '';

    // Build title line — only show department if selected
    const titleLine = dept ? `${title} | ${dept}` : title;
    const country = data.country || '+82';
    const rawPhone = data.phone || '01012345678';
    const formattedPhone = formatPhone(rawPhone, country);
    const fullPhone = `${country} ${formattedPhone}`;
    const email = data.email || 'name@ambienceseoul.com';

    const logoSrc = getCurrentLogoUrl(forClipboard);
    const label = data.label || 'ambience';
    const labelInfo = LABEL_LOGOS[label] || LABEL_LOGOS['ambience'];
    const logoCell = `<td style="width:140px;vertical-align:middle;text-align:right;padding-left:24px;">
           <img src="${logoSrc}" alt="${label}" style="width:120px;height:120px;border-radius:50%;display:block;" />
         </td>`;

    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:520px;">
  <tr>
    <td style="vertical-align:top;padding-right:16px;">
      <div style="font-size:18px;font-weight:700;color:#000000;line-height:1.2;margin-bottom:0px;">${name}</div>
      <div style="font-size:13px;color:#444444;line-height:1.3;margin-bottom:6px;font-weight:400;">${titleLine}</div>
      <div style="font-size:13px;color:#333333;line-height:1.5;">
        <span>${fullPhone}</span><br/>
        <span>${email}</span>
      </div>
      <div style="margin-top:4px;font-size:12px;color:#888888;line-height:1.5;">
        <span>${WEBSITE}</span><br/>
        ${ADDRESS}
      </div>
    </td>
    ${logoCell}
  </tr>
  <tr>
    <td colspan="2" style="padding-top:10px;">
      <div style="font-size:9.5px;color:#cc0000;line-height:1.6;border-top:1px solid #e0e0e0;padding-top:8px;">
        <strong>CONFIDENTIALITY NOTICE:</strong> This email and any attachments are intended solely for the recipient and contain confidential material. Any unauthorized use or distribution is strictly prohibited. If received in error, please notify the sender and delete all copies.<br/>
        본 메일은 수신인 전용 기밀을 포함하고 있으며, 무단 전재 및 배포를 금합니다. 오발송된 경우 즉시 파기 후 발신인에게 알려주시기 바랍니다.
      </div>
    </td>
  </tr>
</table>`;
  }

  // ── Update Preview ──
  function updatePreview() {
    const data = getCurrentData();
    preview.innerHTML = generateSignatureHTML(data, false);
    updateLogoPreview();
  }

  function getCurrentData() {
    return {
      firstname: fields.firstname.value.trim(),
      lastname: fields.lastname.value.trim(),
      title: fields.title.value.trim(),
      dept: fields.dept.value.trim(),
      country: fields.country.value,
      phone: fields.phone.value.trim(),
      email: fields.email.value.trim(),
      label: fields.label.value,
      logoUrl: fields.logoUrl.value.trim(),
    };
  }

  // ── Copy to Clipboard ──
  async function copySignature(asCode = false) {
    const data = getCurrentData();
    const html = generateSignatureHTML(data, true);

    try {
      if (asCode) {
        await navigator.clipboard.writeText(html);
        showToast('✅ HTML 코드가 복사되었습니다');
      } else {
        const blob = new Blob([html], { type: 'text/html' });
        const plainBlob = new Blob([html], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blob,
            'text/plain': plainBlob,
          }),
        ]);

        const copyIcon = copyBtn.querySelector('.material-icons-round');
        const origText = copyBtn.innerHTML;
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<span class="material-icons-round btn-icon-sm">check</span> 복사 완료!';
        showToast('✅ 서명이 복사되었습니다 — 메일 서명 설정에 붙여넣기 하세요');

        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.innerHTML = origText;
        }, 2500);
      }
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = html;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('✅ 서명이 복사되었습니다 (HTML 코드)');
    }
  }

  // ── Toast ──
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // ── Guide Tabs ──
  document.querySelectorAll('.guide-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.guide-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.guide-content').forEach((c) => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.target).classList.add('active');
    });
  });

  // ── Event Listeners ──
  Object.values(fields).forEach((input) => {
    input.addEventListener('input', updatePreview);
    input.addEventListener('change', updatePreview);
  });

  copyBtn.addEventListener('click', () => copySignature(false));
  copyCodeBtn.addEventListener('click', () => copySignature(true));

  // ── Initial Render ──
  updatePreview();
});
