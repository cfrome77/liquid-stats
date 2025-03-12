// map.service.ts
import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    private maps: { [key: string]: L.Map } = {};

    // Function to add a map
    addMap(id: string, map: L.Map) {
        this.maps[id] = map;
    }

    // Function to get a map by ID
    getMap(id: string): L.Map | undefined {
        return this.maps[id];
    }

    // Function to remove a map
    removeMap(id: string) {
        delete this.maps[id];
    }
}
