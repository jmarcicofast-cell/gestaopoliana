/* Appearance is local to this browser, independent of shared team data. */
(function () {
  'use strict';
  var key = 'gestaopoliana-appearance-v1';
  var choices = [['fast','Fast · vermelho e preto'],['azul','Azul executivo'],['verde','Verde clássico']];
  function valid(value) { return choices.some(function (item) { return item[0] === value; }); }
  function apply(value) {
    var theme = valid(value) ? value : 'fast';
    document.documentElement.setAttribute('data-appearance', theme);
    document.querySelectorAll('[data-theme-picker]').forEach(function (el) { el.value = theme; });
    return theme;
  }
  var saved;
  try { saved = localStorage.getItem(key); } catch (_) {}
  apply(saved);
  document.addEventListener('DOMContentLoaded', function () {
    ['.auth-panel', '.top-tools'].forEach(function (selector, i) {
      var host = document.querySelector(selector);
      if (!host) return;
      var wrapper = document.createElement('div');
      wrapper.className = 'theme-control';
      var label = document.createElement('label');
      label.htmlFor = 'appearance-' + i;
      label.textContent = 'Visual';
      var select = document.createElement('select');
      select.id = label.htmlFor;
      select.setAttribute('data-theme-picker', '');
      select.title = 'Preferência salva somente neste navegador';
      choices.forEach(function (choice) {
        var option = document.createElement('option');
        option.value = choice[0]; option.textContent = choice[1]; select.appendChild(option);
      });
      select.value = document.documentElement.getAttribute('data-appearance');
      select.addEventListener('change', function () {
        var value = apply(select.value);
        try { localStorage.setItem(key, value); } catch (_) {}
      });
      wrapper.appendChild(label); wrapper.appendChild(select);
      host.prepend(wrapper);
    });
  });
  window.addEventListener('storage', function (event) { if (event.key === key) apply(event.newValue); });
}());
