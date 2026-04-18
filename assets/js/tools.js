function generatePassword() {
  const length = parseInt(document.getElementById('pwd-length').value, 10);
  const includeNumbers = document.getElementById('pwd-include-numbers').checked;
  const includeSymbols = document.getElementById('pwd-include-symbols').checked;

  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  let charset = lowercase + uppercase;
  if (includeNumbers) charset += numbers;
  if (includeSymbols) charset += symbols;

  let password = '';
  for (let index = 0; index < length; index += 1) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  document.getElementById('password-output').textContent = password;
}

function copyPassword(button) {
  const output = document.getElementById('password-output');
  navigator.clipboard.writeText(output.textContent).then(() => {
    const original = button.textContent;
    button.textContent = 'Copied';
    setTimeout(() => {
      button.textContent = original;
    }, 1800);
  });
}

function formatJSON() {
  const input = document.getElementById('json-input').value;
  try {
    const obj = JSON.parse(input);
    document.getElementById('json-output').value = JSON.stringify(obj, null, 2);
  } catch (error) {
    alert('Invalid JSON');
  }
}

function validateJSON() {
  const input = document.getElementById('json-input').value;
  try {
    JSON.parse(input);
    alert('Valid JSON');
  } catch (error) {
    alert(`Invalid JSON: ${error.message}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const generateButton = document.getElementById('generate-password-btn');
  const copyButton = document.getElementById('copy-password-btn');
  const formatButton = document.getElementById('format-json-btn');
  const validateButton = document.getElementById('validate-json-btn');

  if (generateButton) {
    generateButton.addEventListener('click', generatePassword);
  }

  if (copyButton) {
    copyButton.addEventListener('click', () => copyPassword(copyButton));
  }

  if (formatButton) {
    formatButton.addEventListener('click', formatJSON);
  }

  if (validateButton) {
    validateButton.addEventListener('click', validateJSON);
  }
});
