import { override } from '@microsoft/decorators';
import { Log } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer,
  PlaceholderContent,
  PlaceholderName
} from '@microsoft/sp-application-base';
import { NotificationService } from './services/NotificationService';
import ToastManager from './components/Toast';



const LOG_SOURCE: string = 'BtxNotifications';

export default class BtxNotificationsApplicationCustomizer
  extends BaseApplicationCustomizer<{}> {

  private _topPlaceholder: PlaceholderContent | undefined;
  private _service!: NotificationService;
  private _toast!: ToastManager;
  private _interval: any;

  @override
  public async onInit(): Promise<void> {

    this._service = new NotificationService(this.context);
    this._toast = new ToastManager();

    this._renderBellIcon();

    // Initial load
    await this._checkNotifications();

    // refresh every 2 minutes
    this._interval = setInterval(() => {
      this._checkNotifications();
    }, 120000);

    return Promise.resolve();
  }

  private _renderBellIcon() {

    this._topPlaceholder =
      this.context.placeholderProvider.tryCreateContent(
        PlaceholderName.Top
      );

    if (!this._topPlaceholder) return;

    const bell = document.createElement('div');
    bell.className = 'btxBellIcon';
    bell.innerHTML = '🔔';

    bell.onclick = () => this._checkNotifications(true);

    this._topPlaceholder.domElement.appendChild(bell);
  }

  private async _checkNotifications(force = false) {

    const items = await this._service.getNotifications();

    if (!items.length && !force) return;

    items.forEach(n => {
      this._toast.showToast(n);
    });
  }
}
