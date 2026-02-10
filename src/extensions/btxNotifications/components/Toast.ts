import './Toast.scss';

export default class ToastManager {

  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'btxToastContainer';
    document.body.appendChild(this.container);
  }

  public showToast(data: any) {

    const el = document.createElement('div');
    el.className = 'btxToast';

    el.innerHTML = `
      <div class="btxTitle">${data.Title}</div>
      <div class="btxDesc">${data.Description || ''}</div>
    `;

    this.container.appendChild(el);

    setTimeout(() => {
      el.classList.add('hide');
      setTimeout(() => el.remove(), 300);
    }, 10000);
  }
}
