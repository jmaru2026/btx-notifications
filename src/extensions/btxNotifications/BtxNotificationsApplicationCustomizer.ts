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

  /* =====================================
   LOCAL STORAGE HELPERS
===================================== */

  private _storageKey = 'BtxNotifications_ReadIds';

  private _getReadIds(): number[] {

    const raw = localStorage.getItem(this._storageKey);

    if (!raw) return [];

    // ⭐ force numbers
    return JSON.parse(raw).map((x: any) => Number(x));
  }


  private _markAsRead(id: number) {

    const readIds = this._getReadIds();

    id = Number(id); // ⭐ important

    if (readIds.indexOf(id) === -1) {
      readIds.push(id);
      localStorage.setItem(this._storageKey, JSON.stringify(readIds));
    }
  }


  private _filterUnread(items: any[]): any[] {

    const readIds = this._getReadIds();

    return items.filter(x => readIds.indexOf(x.Id) === -1);
  }


  /* ---------------------------------------ß
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

    // this._allItems = await this._service.getNotifications();
    const items = await this._service.getNotifications();
    this._allItems = this._filterUnread(items);

    this._renderPanel();
    this._updateBadge();
  }

  /* ---------------------------------------
     NEW → TOAST
  --------------------------------------- */

  // private _previousCount = 0;

  // private async _checkNew() {

  //   const items = await this._service.getNotifications();

  //   const newCount = items.length;

  //   // first load → don't toast
  //   if (this._previousCount === 0) {
  //     this._previousCount = newCount;
  //     this._allItems = items;
  //     this._renderPanel();
  //     this._updateBadge();
  //     return;
  //   }

  //   // new items added
  //   if (newCount > this._previousCount) {

  //     const diff = newCount - this._previousCount;

  //     // show ONLY latest added items
  //     const newItems = items.slice(0, diff);

  //     newItems.forEach(x => this._toast.showToast(x));
  //   }

  //   this._previousCount = newCount;
  //   this._allItems = items;

  //   this._renderPanel();
  //   this._updateBadge();
  // }
  private _lastMaxId = 0;

  private async _checkNew() {

    const items = await this._service.getNotifications();

    if (!items.length) return;

    const newestId = items[0].Id; // because sorted desc

    // first load
    if (this._lastMaxId === 0) {
      this._lastMaxId = newestId;
      // this._allItems = items;
      this._allItems = this._filterUnread(items);
      this._renderPanel();
      this._updateBadge();
      return;
    }

    // only new items
    const newItems = items.filter(x => x.Id > this._lastMaxId);

    newItems.forEach(x => this._toast.showToast(x));

    this._lastMaxId = newestId;

    // this._allItems = items;
    this._allItems = this._filterUnread(items);


    this._renderPanel();
    this._updateBadge();
  }

  private _formatDate(dateString: string): string {

    const created = new Date(dateString);
    const now = new Date();

    const diffMs = now.getTime() - created.getTime();

    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);

    if (sec < 60) return 'Just now';

    if (min < 60)
      return `${min} minute${min > 1 ? 's' : ''} ago`;

    if (hr < 24)
      return `${hr} hour${hr > 1 ? 's' : ''} ago`;

    if (day === 1)
      return 'Yesterday';

    if (day < 7)
      return `${day} days ago`;

    // older → show date like SharePoint
    return created.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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

    const list = this._allItems.slice(0, 5);

    list.forEach(n => {

      const row = document.createElement('div');
      row.className = 'btxItem';

      row.innerHTML = `
        <div class="btxTitle">${n.Title}</div>
        <div class="btxDesc">${n.Description || ''}</div>
        <div class="CreatedDate">${this._formatDate(n?.Created) || ''}</div>
      `;

      // if (n?.Link)
      //   row.onclick = () => window.open(n?.Link, '_blank');
      row.onclick = () => {

        this._markAsRead(n.Id);

        this._allItems = this._allItems.filter(x => x.Id !== n.Id);

        row.remove(); // only remove clicked row
        this._updateBadge();

        if (n?.Link) {
          window.open(n.Link, '_blank');
        }
      };




      panel.appendChild(row);
    });

    const viewAll = document.createElement('a');
    viewAll.className = 'btxViewAll';
    viewAll.innerText = 'View All';
    viewAll.href = 'https://saisystemstech.sharepoint.com/sites/BTXHub/Lists/BtxNotifications/AllItems.aspx?viewid=b98ffcde%2Df324%2D4776%2Db67e%2D02bac3c549a6';
    viewAll.target = '_blank'

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