// Third party library.
import {Component} from '@angular/core';
import {NavController, NavParams, ViewController} from 'ionic-angular';

// Utils.
import {Util} from '../../../utils/util';

// Services.
import {ScheduleService} from '../../../providers/schedule-service';

@Component({
    selector: 'page-schedule-select-devices',
    templateUrl: 'select-devices.html',
    providers: [Util,
        ScheduleService]
})

export class SelectDevicesPage {

    public originDevices: any;
    public selectedDeviceCount: number;
    public selectedDevices: any[] = new Array();
    public devices: any;
    public isSearching: boolean;
    public foundDevices: any;

    constructor(private nav: NavController, private viewCtrl: ViewController, private util: Util, private params: NavParams, private scheduleService: ScheduleService) {

        this.originDevices = this.params.get('devices');
        this.getDevices().then(data => {
            this.selectedDeviceCount = 0;
            this.setOriginSelectedDevices();
        });
    }

    getDevices(): any {
        return new Promise(resolve => {
            this.scheduleService.getDeviceListForSelect().then(devices => {
                this.devices = devices;
                resolve(this.devices);
            });

        });
    }

    findDevices(event: any): void {
        this.isSearching = true;
        let deviceName = event.target.value;

        this.foundDevices = this.devices;
        if (deviceName && deviceName.trim() !== '') {
            this.foundDevices = this.foundDevices.filter((device) => {
                return (device.deviceName.toLowerCase().indexOf(deviceName.toLowerCase()) > -1);
            })
        } else {
            this.isSearching = false;
        }
    }

    changeSelectedDevice(device: any): void {
        if (device.isSelected === true) {
            this.selectedDevices.push(device);
            this.selectedDeviceCount++;
        } else {
            let index = this.selectedDevices.indexOf(device);
            if (index !== -1) {
                this.selectedDevices.splice(index, 1);
            }
            this.selectedDeviceCount--;
        }
    }

    setOriginSelectedDevices(): void {
        for (let i = 0; i < this.originDevices.length; i++) {
            for (let j = 0; j < this.devices.length; j++) {
                if (this.originDevices[i].deviceID === this.devices[j].deviceID) {
                    this.devices[j].isSelected = true;
                    this.selectedDeviceCount++;
                    this.selectedDevices.push(this.devices[j]);
                }
            }
        }
    }

    close(): void {
        this.viewCtrl.dismiss(this.originDevices);
    }

    selectDevices(): void {
        let sendDevices = new Array();
        this.selectedDevices.forEach(function (selectedDevice) {
            let device = {
                'deviceID': selectedDevice.deviceID,
                'deviceName': selectedDevice.deviceName
            };
            sendDevices.push(device);
        });
        this.viewCtrl.dismiss(sendDevices);
    }
}