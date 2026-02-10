import { override } from '@microsoft/decorators';
import { BaseApplicationCustomizer } from '@microsoft/sp-application-base';
import { NotificationService } from './services/NotificationService';
import ToastManager from './components/Toast';

export default class BtxNotificationsApplicationCustomizer
  extends BaseApplicationCustomizer<{}> {

  private _service!: NotificationService;
  private _toast!: ToastManager;

  private _observer?: MutationObserver;

  private _allItems: any[] = [];
  _interval: number;

  @override
  public async onInit(): Promise<void> {

    this._service = new NotificationService(this.context);
    this._toast = new ToastManager();

    this._watchHeader();

    await this._loadAll();

    // every 1 minute → check new
    this._interval = window.setInterval(() => {
      this._checkNew();
    }, 60000);

    return Promise.resolve();
  }

  /* ---------------------------------------
     HEADER + BELL
  --------------------------------------- */
  private _watchHeader() {

    const inject = () => {

      const header = document.getElementById('HeaderButtonRegion');
      if (!header) return;

      if (document.getElementById('btxBellWrapper')) return;

      const wrapper = document.createElement('div');
      wrapper.id = 'btxBellWrapper';
      wrapper.className = 'btxBellWrapper';

      const btn = document.createElement('button');
      btn.className = 'btxBellBtn';
      btn.innerHTML = this._bellSvg();

      const badge = document.createElement('span');
      badge.id = 'btxBadge';
      badge.className = 'btxBadge';

      btn.onclick = () => this._togglePanel();

      wrapper.appendChild(btn);
      wrapper.appendChild(badge);

      header.insertBefore(wrapper,
        document.getElementById('O365_MainLink_Settings_container')
      );

      this._createPanel(wrapper);
    };

    inject();

    this._observer = new MutationObserver(() => inject());
    this._observer.observe(document.body, { childList: true, subtree: true });
  }

  /* ---------------------------------------
     PANEL
  --------------------------------------- */
  private _createPanel(wrapper: HTMLElement) {

    const panel = document.createElement('div');
    panel.id = 'btxPanel';
    panel.className = 'btxPanel';

    wrapper.appendChild(panel);
  }

  private _togglePanel() {
    const panel = document.getElementById('btxPanel');
    panel?.classList.toggle('show');
  }

  /* ---------------------------------------
     LOAD ALL
  --------------------------------------- */
  private async _loadAll() {

    this._allItems = await this._service.getNotifications();
    this._renderPanel();
    this._updateBadge();
  }

  /* ---------------------------------------
     NEW → TOAST
  --------------------------------------- */
  // private async _checkNew() {

  //   const items = await this._service.getNotifications();

  //   const newItems = items.filter(x =>
  //     new Date(x.Created) > this._lastCheck
  //   );

  //   newItems.forEach(x => this._toast.showToast(x));

  //   this._lastCheck = new Date();
  //   this._allItems = items;

  //   this._renderPanel();
  //   this._updateBadge();
  // }
  private _previousCount = 0;

private async _checkNew() {

  const items = await this._service.getNotifications();

  const newCount = items.length;

  // first load → don't toast
  if (this._previousCount === 0) {
    this._previousCount = newCount;
    this._allItems = items;
    this._renderPanel();
    this._updateBadge();
    return;
  }

  // new items added
  if (newCount > this._previousCount) {

    const diff = newCount - this._previousCount;

    // show ONLY latest added items
    const newItems = items.slice(0, diff);

    newItems.forEach(x => this._toast.showToast(x));
  }

  this._previousCount = newCount;
  this._allItems = items;

  this._renderPanel();
  this._updateBadge();
}


  /* ---------------------------------------
     PANEL RENDER
  --------------------------------------- */
  private _renderPanel() {

    const panel = document.getElementById('btxPanel');
    if (!panel) return;

    panel.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'btxPanelHeader';
    header.innerHTML = `
      <span>Notifications</span>
      <span class="btxClose">✕</span>
    `;
    const closeBtn = header.querySelector<HTMLElement>('.btxClose');

    closeBtn?.addEventListener('click', () => {
      panel.classList.remove('show');
    });


    panel.appendChild(header);

    const list = this._allItems.slice(0, 8);

    list.forEach(n => {

      const row = document.createElement('div');
      row.className = 'btxItem';

      row.innerHTML = `
        <div class="btxTitle">${n.Title}</div>
        <div class="btxDesc">${n.Description || ''}</div>
      `;

      if (n?.Link)
        row.onclick = () => window.open(n?.Link, '_blank');

      panel.appendChild(row);
    });

    const viewAll = document.createElement('a');
    viewAll.className = 'btxViewAll';
    viewAll.innerText = 'View All';
    viewAll.href = 'https://saisystemstech.sharepoint.com/sites/BTXHub/Lists/BtxNotifications/AllItems.aspx?viewid=b98ffcde%2Df324%2D4776%2Db67e%2D02bac3c549a6';
    viewAll.target='_blank'

    panel.appendChild(viewAll);
  }

  private _updateBadge() {
    const badge = document.getElementById('btxBadge');
    if (!badge) return;

    const count = this._allItems.length;

    badge.innerText = count > 0 ? count.toString() : '';
    badge.style.display = count ? 'flex' : 'none';
  }

  private _bellSvg() {
    return `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 10-12 0v5L4 18v1h16v-1l-2-2z"/>
    </svg>`;
  }
}