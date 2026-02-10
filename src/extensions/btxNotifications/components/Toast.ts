import './Toast.scss';

export default class ToastManager {

  private container: HTMLElement;
  private maxVisible = 5;

  constructor() {

    let existing = document.querySelector('.btxToastContainer');

    if (existing) {
      this.container = existing as HTMLElement;
      return;
    }

    this.container = document.createElement('div');
    this.container.className = 'btxToastContainer';

    document.body.appendChild(this.container);
  }

  /* =========================================
     SHOW TOAST
  ========================================= */
  public showToast(data: any) {

    // limit visible toasts
    if (this.container.children.length >= this.maxVisible) {
      this.container.firstElementChild?.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'btxToast';

    toast.innerHTML = `
      <div class="btxToastContent">
        <div class="btxToastText">
          <div class="btxTitle">${data.Title}</div>
          <div class="btxDesc">${data.Description || ''}</div>
        </div>
        <span class="btxClose">✕</span>
      </div>
    `;

    /* click open link */
    if (data?.Link) {
      toast.style.cursor = 'pointer';
      toast.onclick = () => window.open(data.Link, '_blank');
    }

    /* close button */
    const close = toast.querySelector('.btxClose') as HTMLElement;

    close?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._removeToast(toast);
    });

    this.container.appendChild(toast);

    /* auto remove */
    setTimeout(() => {
      this._removeToast(toast);
    }, 10000);
  }

  /* =========================================
     REMOVE
  ========================================= */
  private _removeToast(el: HTMLElement) {

    el.classList.add('hide');

    setTimeout(() => {
      el.remove();
    }, 300);
  }
}

