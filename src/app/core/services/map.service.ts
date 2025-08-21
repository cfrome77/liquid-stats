import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    private maps: { [key: string]: L.Map } = {};

    addMap(id: string, map: L.Map) {
        this.maps[id] = map;
    }

    getMap(id: string): L.Map | undefined {
        return this.maps[id];
    }

    removeMap(id: string) {
        delete this.maps[id];
    }
}
