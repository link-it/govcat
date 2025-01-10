
export class Erogazioni {

    url: string | null = null;
    indirizzi_ip: string | null = null;
    certificato_server?: any = null;

constructor(_data?: any) {
        if (_data) {
            for (const key in _data) {
                if (this.hasOwnProperty(key)) {
                    if (_data[key] !== null && _data[key] !== undefined) {
                        switch (key) {
                            default:
                                (this as any)[key] = _data[key];
                        }
                    }
                }
            }
        }
    }
}
