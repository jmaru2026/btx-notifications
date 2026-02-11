import { SPHttpClient } from '@microsoft/sp-http';
import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';

export class NotificationService {

  constructor(private context: ApplicationCustomizerContext) {}

  public async getNotifications(): Promise<any[]> {

    const url = `${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('BtxNotifications')/items?$filter=IsActive eq 1&$select=Title,Description,Link,Created,ID,Id&$orderby=Created desc&$top=5000`;

    const res = await this.context.spHttpClient.get(url, SPHttpClient.configurations.v1);

    const json = await res.json();

    return json.value || [];
  }
}
