import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { jwtDecode } from "jwt-decode";

@Injectable({
    providedIn: 'root',
})
export class AuthenticationDialogService {

    constructor(
        private translate: TranslateService
    ) { }

    detectKeyFormat(fileContent: any) {
        // Verifica se il contenuto è una stringa (PEM)
        if (typeof fileContent === 'string' && fileContent.includes('-----BEGIN')) {
            return 'PEM';
        }

        // Se non è una stringa, consideriamo che sia DER (binario)
        return 'DER';
    }

    convertDERToPEM(derBuffer: any) {
        const byteArray = new Uint8Array(derBuffer);
        let binaryString = '';
        for (let i = 0; i < byteArray.byteLength; i++) {
            binaryString += String.fromCharCode(byteArray[i]);
        }

        // Codifica la stringa binaria in Base64
        const base64String = window.btoa(binaryString);

        // Verifica se la conversione in base64 è riuscita
        if (!base64String) {
            throw new Error("Errore durante la conversione del DER in Base64");
        }

        return base64String;
    }

    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    bufferToHex(buffer: any) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    bufferToBase64(buffer: any) {
        const byteArray = new Uint8Array(buffer);
        let binaryString = '';
        for (let i = 0; i < byteArray.byteLength; i++) {
            binaryString += String.fromCharCode(byteArray[i]);
        }
        return btoa(binaryString);
    }

    async calculateSHA256(input: string, useBase64: boolean) {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);

        const hashBuffer = await crypto.subtle.digest('SHA-256', data);

        return useBase64 ? this.bufferToBase64(hashBuffer) : this.bufferToHex(hashBuffer);
    }

    buildPEMString(base64String: string, label: string) {
        const formattedBase64 = base64String.match(/.{1,64}/g);

        // Verifica se la conversione in linee è riuscita
        if (!formattedBase64) {
            throw new Error("Errore durante la formattazione del Base64 in righe");
        }

        // Costruisci e restituisci la stringa PEM
        return `-----BEGIN ${label}-----\n${formattedBase64.join('\n')}\n-----END ${label}-----\n`;
    }

    convertMinutesToHours(minutes: number) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }

    convertMinutesToDays(minutes: number) {
        const days = Math.floor(minutes / 1440);
        const remainingMinutesFromDays = minutes % 1440;
        const hours = Math.floor(remainingMinutesFromDays / 60);
        const remainingMinutes = remainingMinutesFromDays % 60;
        return `${days}d ${hours}h ${remainingMinutes}m`;
    }

    convertSecondsToHours(seconds: number) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return remainingSeconds ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
}
