// Тохиргоо
const config = {
  price: 20000,
  bankName: 'Голомт Банк',
  bankAccount: '2405165138',
  recipient: 'Цэлмүүн Амгалан',
  deliveryTime: '7-10 хоног',
  freeDelivery: true,
  contactPhone: '89972850',
  telegramBotToken: '7815891915:AAE5Y7GZRtQ9v6CIzLL0StQqmSbpp2j5DXQ',
  telegramChatId: '1975855506'
};

// DOM элементүүд
const elements = {
  orderBtn: document.getElementById('orderBtn'),
  orderForm: document.getElementById('orderForm'),
  form: document.getElementById('form'),
  transactionCode: document.getElementById('transactionCode'),
  phoneInput: document.getElementById('phone'),
  phoneError: document.getElementById('phoneError'),
  loading: document.querySelector('.loading'),
  successMessage: document.getElementById('successMessage'),
  submitBtn: document.getElementById('submitBtn'),
  termsCheckbox: document.getElementById('terms')
};

// Гүйцэтгэлийн функцууд
const utils = {
  generateTransactionCode: () => `SJ${Math.floor(10000 + Math.random() * 90000)}`,
  
  validatePhone: (phone) => /^[0-9]{8}$/.test(phone),
  
  formatAmount: (amount) => amount.toLocaleString() + '₮',
  
  scrollToElement: (element) => {
    element.scrollIntoView({ behavior: 'smooth' });
  },
  
  showAlert: (message) => {
    alert(message);
  }
};

// Telegram сервис
// Telegram сервис
const telegramService = {
  sendNotification: async (orderData) => {
    const TELEGRAM_API = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
    
    const message = `🛒 <b>ШИНЭ ЗАХИАЛГА</b> 🛒\n\n` +
                   `👤 <b>Нэр:</b> ${orderData.name}\n` +
                   `📞 <b>Утас:</b> ${orderData.phone}\n` +
                   `🏠 <b>Хаяг:</b> ${orderData.address}\n` +
                   `🔢 <b>Тоо ширхэг:</b> ${orderData.quantity}\n` +
                   `💰 <b>Нийт дүн:</b> ${orderData.totalAmount}\n` +
                   `🏦 <b>Банкны мэдээлэл:</b> ${config.bankName} ${config.bankAccount}\n` +
                   `🛒 <b>Захиалгын код:</b> ${orderData.transactionCode}\n\n` +
                   `⏱ <i>${new Date().toLocaleString('mn-MN')}</i>`;

    try {
      // 1. Эхлээд шууд илгээх оролдлого
      let response = await fetch(TELEGRAM_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: config.telegramChatId,
          text: message,
          parse_mode: 'HTML'
        })
      });
      
      // Хэрэв CORS алдаа гарвал proxy ашиглах
      if (!response.ok) {
        const PROXY_URL = 'https://cors-proxy-mongolia.herokuapp.com/';
        response = await fetch(PROXY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Target-URL': TELEGRAM_API
          },
          body: JSON.stringify({
            chat_id: config.telegramChatId,
            text: message,
            parse_mode: 'HTML'
          })
        });
      }
      
      const result = await response.json();
      console.log('Telegram хариу:', result);
      
      if (!result.ok) {
        throw new Error(result.description || 'Тодорхойгүй алдаа');
      }
      return true;
    } catch (error) {
      console.error('Илгээхэд алдаа:', error);
      utils.showAlert(`Алдаа: ${error.message}. ${config.contactPhone} дугаарт холбогдоно уу.`);
      return false;
    }
  }
};

// Форм харилцагч
const formHandler = {
  init: () => {
    elements.orderBtn.addEventListener('click', formHandler.showForm);
    elements.phoneInput.addEventListener('input', formHandler.validatePhoneInput);
    elements.form.addEventListener('submit', formHandler.handleSubmit);
  },
  
  showForm: () => {
    elements.orderForm.style.display = 'block';
    elements.transactionCode.textContent = utils.generateTransactionCode();
    setTimeout(() => utils.scrollToElement(elements.orderForm), 100);
  },
  
  validatePhoneInput: () => {
    elements.phoneError.textContent = 
      /^[0-9]{0,8}$/.test(elements.phoneInput.value) ? '' : 'Зөвхөн 8 оронтой тоо оруулна уу';
  },
  
  validateForm: () => {
    if (!utils.validatePhone(elements.phoneInput.value)) {
      elements.phoneError.textContent = '8 оронтой дугаар оруулна уу';
      return false;
    }
    
    if (!elements.termsCheckbox.checked) {
      utils.showAlert('Захиалга өгөхийн тулд нөхцөлүүдтэй танилцаж, зөвшөөрнө үү');
      return false;
    }
    
    return true;
  },
  
  prepareFormData: () => {
    const quantity = parseInt(elements.form.quantity.value) || 1;
    return {
      name: elements.form.name.value.trim(),
      phone: elements.form.phone.value.trim(),
      address: elements.form.address.value.trim(),
      quantity: quantity,
      totalAmount: utils.formatAmount(config.price * quantity),
      transactionCode: elements.transactionCode.textContent
    };
  },
  
  handleSubmit: async (e) => {
    e.preventDefault();
    
    if (!formHandler.validateForm()) return;
    
    elements.loading.style.display = 'block';
    elements.submitBtn.disabled = true;
    
    const formData = formHandler.prepareFormData();
    
    try {
      const success = await telegramService.sendNotification(formData);
      
      if (success) {
        elements.form.style.display = 'none';
        elements.successMessage.style.display = 'block';
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      elements.loading.style.display = 'none';
      elements.submitBtn.disabled = false;
    }
  }
};

// Хэрэглээний эхлэл
document.addEventListener('DOMContentLoaded', () => {
  formHandler.init();
});