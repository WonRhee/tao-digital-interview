import { Browser, Page } from "puppeteer";

export class PuppetHelper {
    constructor(private browser:Browser) {
        browser.once('disconnected', this.disconnectHandler)
    }

    private disconnectHandler = () => {
        PuppetHelper.log('Browser disconnected.')
    }

    static log = (...messssages: string[]) => {
        console.log(...messssages)
    }

    public newPage = async () => {
        const page = await this.browser.newPage()
    }
}