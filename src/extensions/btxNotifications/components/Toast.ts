import './Toast.scss';

export default class ToastManager {

  private container: HTMLElement;

  constructor() {

    this.container = document.createElement('div');
    this.container.className = 'btxToastContainer';

    document.body.appendChild(this.container);
  }

  public showToast(data: any) {

    const toast = document.createElement('div');
    toast.className = 'btxToast';

    toast.innerHTML = `
      <div class="btxTitle">${data.Title}</div>
      <div class="btxDesc">${data.Description || ''}</div>
      ${data.Link ? `<a href="${data.Link.Url}" target="_blank" class="btxBtn">Open</a>` : ''}
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }, 10000);
  }
}
