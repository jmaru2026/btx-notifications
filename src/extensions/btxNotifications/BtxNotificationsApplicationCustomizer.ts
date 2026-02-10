import { override } from '@microsoft/decorators';
import { BaseApplicationCustomizer } from '@microsoft/sp-application-base';

import { NotificationService } from './services/NotificationService';
import ToastManager from './components/Toast';

export default class BtxNotificationsApplicationCustomizer
  extends BaseApplicationCustomizer<{}> {

  private _service!: NotificationService;
  private _toast!: ToastManager;

  private _interval?: number;
  private _observer?: MutationObserver;

  private _lastCheckTime: Date = new Date();

  /* =====================================================
     INIT
  ===================================================== */
  @override
  public async onInit(): Promise<void> {

    this._service = new NotificationService(this.context);
    this._toast = new ToastManager();

    this._watchHeaderAndInject();

    await this._loadAllToPanel();

    // every 1 minute
    this._interval = window.setInterval(async () => {
      await this._checkNewNotifications();
    }, 60000);

    return Promise.resolve();
  }

  /* =====================================================
     HEADER + PANEL
  ===================================================== */
  private _watchHeaderAndInject(): void {

    const inject = () => {

      const header = document.getElementById('HeaderButtonRegion');
      if (!header) return;

      if (document.getElementById('btxBellWrapper')) return;

      const wrapper = document.createElement('div');
      wrapper.id = 'btxBellWrapper';
      wrapper.className = 'btxBellWrapper';

      const btn = document.createElement('button');
      btn.className = 'btxBellBtn';
      btn.innerHTML = this._bellSvg(); // white icon

      const panel = document.createElement('div');
      panel.id = 'btxPanel';
      panel.className = 'btxPanel';

      btn.onclick = () => {
        panel.classList.toggle('show');
      };

      wrapper.appendChild(btn);
      wrapper.appendChild(panel);

      const settings = document.getElementById('O365_MainLink_Settings_container');

      if (settings) header.insertBefore(wrapper, settings);
      else header.appendChild(wrapper);
    };

    inject();

    this._observer = new MutationObserver(() => inject());

    this._observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /* =====================================================
     LOAD ALL FOR PANEL
  ===================================================== */
  private async _loadAllToPanel() {

    const items = await this._service.getNotifications();
    this._renderPanel(items);
  }

  /* =====================================================
     ONLY NEW → TOAST
  ===================================================== */
  private async _checkNewNotifications() {

    const items = await this._service.getNotifications();

    const newItems = items.filter(i =>
      new Date(i.Created) > this._lastCheckTime
    );

    newItems.forEach(i => this._toast.showToast(i));

    this._lastCheckTime = new Date();

    this._renderPanel(items);
  }

  /* =====================================================
     PANEL UI
  ===================================================== */
  private _renderPanel(items: any[]) {

    const panel = document.getElementById('btxPanel');
    if (!panel) return;

    panel.innerHTML = '';

    if (!items.length) {
      panel.innerHTML = `<div class="btxEmpty">No notifications</div>`;
      return;
    }

    items.forEach(n => {

      const row = document.createElement('div');
      row.className = 'btxItem';

      row.innerHTML = `
        <div class="btxTitle">${n.Title}</div>
        <div class="btxDesc">${n.Description || ''}</div>
      `;

      if (n.Link?.Url) {
        row.onclick = () => window.open(n.Link.Url, '_blank');
      }

      panel.appendChild(row);
    });
  }

  /* =====================================================
     WHITE SVG ICON
  ===================================================== */
  private _bellSvg(): string {
    return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 10-12 0v5L4 18v1h16v-1l-2-2z"/>
      </svg>
    `;
  }

  /* =====================================================
     CLEANUP
  ===================================================== */
  @override
  public onDispose(): void {
    this._observer?.disconnect();
    if (this._interval) clearInterval(this._interval);
  }
}


// import { override } from '@microsoft/decorators';
// import {
//   BaseApplicationCustomizer
// } from '@microsoft/sp-application-base';

// import { NotificationService } from './services/NotificationService';
// import ToastManager from './components/Toast';

// export default class BtxNotificationsApplicationCustomizer
//   extends BaseApplicationCustomizer<{}> {

//   private _service!: NotificationService;
//   private _toast!: ToastManager;
//   private _interval: number | undefined;
//   private _observer: MutationObserver | undefined;

//   /* =====================================================
//      INIT
//   ===================================================== */
//   @override
//   public async onInit(): Promise<void> {

//     this._service = new NotificationService(this.context);
//     this._toast = new ToastManager();

//     this._watchHeaderAndInject();

//     await this._checkNotifications();

//     // refresh every 2 minutes
//     this._interval = window.setInterval(() => {
//       this._checkNotifications();
//     }, 120000);

//     return Promise.resolve();
//   }

//   /* =====================================================
//      HEADER ICON (ROBUST + SPA SAFE)
//   ===================================================== */
//   private _watchHeaderAndInject(): void {

//     const injectBell = () => {

//       const header = document.getElementById('HeaderButtonRegion');
//       if (!header) return;

//       // prevent duplicates
//       if (document.getElementById('btxHeaderBell')) return;

//       const wrapper = document.createElement('div');
//       wrapper.id = 'btxHeaderBell';
//       wrapper.className = 'btxHeaderBellWrapper';

//       const btn = document.createElement('button');
//       btn.className = 'btxHeaderBell';
//       btn.title = 'Notifications';
//       btn.innerHTML = '🔔';

//       btn.onclick = () => this._checkNotifications(true);

//       wrapper.appendChild(btn);

//       const settings = document.getElementById('O365_MainLink_Settings_container');

//       if (settings) {
//         header.insertBefore(wrapper, settings);
//       } else {
//         header.appendChild(wrapper);
//       }
//     };

//     // inject immediately
//     injectBell();

//     // observe SPA header rebuilds
//     this._observer = new MutationObserver(() => injectBell());

//     this._observer.observe(document.body, {
//       childList: true,
//       subtree: true
//     });
//   }

//   /* =====================================================
//      FETCH + SHOW TOASTS
//   ===================================================== */
//   private async _checkNotifications(force = false): Promise<void> {

//     const items = await this._service.getNotifications();

//     if (!items.length && !force) return;

//     items.forEach(item => {
//       this._toast.showToast(item);
//     });
//   }

//   /* =====================================================
//      CLEANUP (good practice)
//   ===================================================== */
//   @override
//   public onDispose(): void {

//     if (this._interval) {
//       clearInterval(this._interval);
//     }

//     if (this._observer) {
//       this._observer.disconnect();
//     }
//   }
// }
