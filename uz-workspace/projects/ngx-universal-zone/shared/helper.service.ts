import { Injectable } from '@angular/core';

@Injectable()
export class HelperService {
  constructor() {}

  deepCopy(obj: any) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
      return obj.reduce((arr, item, i) => {
        arr[i] = this.deepCopy(item);
        return arr;
      }, []);
    }

    if (obj instanceof Object) {
      return Object.keys(obj).reduce((newObj, key) => {
        newObj[key] = this.deepCopy(obj[key]);
        return newObj;
      }, {});
    }
  }

  //https://stackoverflow.com/a/20285053/859968
  toDataURL(url) {
    return new Promise((resolve) => {
      let xhr = new XMLHttpRequest();
      xhr.onload = function () {
        const reader = new FileReader();
        reader.onloadend = function () {
          resolve(reader.result);
        };
        reader.readAsDataURL(xhr.response);
      };
      xhr.open('GET', url);
      xhr.responseType = 'blob';
      xhr.send();
    });
  }

  //https://stackoverflow.com/a/2117523/859968
  generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  getRandomNumber() {
    const random = new Date().getTime() + Math.floor(Math.random() * 1000000);
    return random;
  }

  getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  getFormValidationErrors(formName) {
    Object.keys(formName.controls).forEach((key) => {
      const controlErrors = formName.get(key).errors;
      if (controlErrors != null) {
        Object.keys(controlErrors).forEach((keyError) => {
          console.log(
            'Key control: ' + key + ', keyError: ' + keyError + ', err value: ',
            controlErrors[keyError]
          );
        });
      }
    });
  }

  removeFormValidationErrors(formName, controlName, errorKey) {
    const controlErrors = formName.get(controlName).errors;
    if (controlErrors != null) {
      const error = Object.keys(controlErrors).filter((k) => k == errorKey);
      if (error) {
        controlErrors[errorKey] = undefined;
        delete controlErrors[errorKey];
      }
    }
  }

  downloadCanvasAsImage(canvas: HTMLCanvasElement) {
    // const download = document.getElementById("download");
    const image = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');

    const link = document.createElement('a');
    link.setAttribute('href', image);
    link.download = `${this.generateGuid()}.png`;
    link.click();

    // setTimeout(() => {
    //     link.remove();
    // });
  }

  getParamsObjectsFromUrl(url) {
    let obj;
    if (url) {
      url = decodeURI(url);
    }
    let urlArr = url.split(';');
    if (urlArr.length) {
      urlArr.shift();
    }
    for (const urlItem of urlArr) {
      if (!obj) {
        obj = {};
      }
      //e.g key = value
      const urlItemObj = urlItem.split('=');
      obj[urlItemObj[0]] = urlItemObj[1];
    }
    return obj;
  }
}
