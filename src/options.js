/* ==========================================================================
   PIXEL DOG — OPTIONS PAGE LOGIC (src/options.js)
   Loads and saves user configuration via browser.storage.local.
   ========================================================================== */

(function () {
  const form = document.getElementById('options-form');
  const resetBtn = document.getElementById('reset-btn');
  const toast = document.getElementById('toast');

  const fields = [
    'enabled', 'showCrumbs', 'sleepMs', 'patienceMs', 'rampageMs',
    'runSpeed', 'biteMinChars', 'biteMaxChars', 'maxBitesPerRun',
    'dogCorner', 'dogSize', 'bowlSize', 'treatSize'
  ];

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  function loadOptions() {
    pdStorageGet(PD_DEFAULTS, (items) => {
      fields.forEach((key) => {
        const el = document.getElementById(key);
        if (!el) return;

        if (el.type === 'checkbox') {
          el.checked = Boolean(items[key]);
        } else if (el.type === 'number') {
          el.value = items[key];
        } else {
          el.value = items[key];
        }
      });
    });
  }

  function saveOptions(e) {
    if (e) e.preventDefault();

    const newSettings = {};
    fields.forEach((key) => {
      const el = document.getElementById(key);
      if (!el) return;

      if (el.type === 'checkbox') {
        newSettings[key] = el.checked;
      } else if (el.type === 'number') {
        newSettings[key] = Number(el.value);
      } else {
        newSettings[key] = el.value;
      }
    });

    pdStorageSet(newSettings, () => {
      showToast('Settings saved!');
    });
  }

  function resetOptions() {
    pdStorageSet(PD_DEFAULTS, () => {
      loadOptions();
      showToast('Reset to default settings!');
    });
  }

  document.addEventListener('DOMContentLoaded', loadOptions);
  form.addEventListener('submit', saveOptions);
  resetBtn.addEventListener('click', resetOptions);
})();
