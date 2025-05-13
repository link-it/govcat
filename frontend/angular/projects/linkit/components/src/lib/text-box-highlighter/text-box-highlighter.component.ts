import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-text-box-highlighter',
    templateUrl: './text-box-highlighter.component.html',
    styleUrls: [
        './text-box-highlighter.component.scss'
    ],
    standalone: false
})
export class TextBoxHighlighterComponent implements OnInit {
  @Input() text: string = '';
  @Input() isBase64: boolean = false;
  @Input() config: any[] = [];
  @Input() type: string = 'TYPE_DEFAULT';
  @Input() showTooltip: boolean = false;

  @Output('select') _select: EventEmitter<any> = new EventEmitter();

  _textDecoded: string = '';
  _displayText: string = '';
  _displayRows: string[] = [];

  _itemList: any[] = [];

  _analizing: boolean = false;

  constructor() { }

  ngOnInit() {
    this._analizing = true;
    this._textDecoded = this.text;
    if (this.isBase64) {
      this._textDecoded = this._decodeB64(this.text);
    }
    this._displayText = this._textDecoded;
    if (this.config.length > 0) {
      this._displayText = this._highlightText(this._textDecoded);
      this._createTextRows(this._textDecoded);
    }
    this._analizing = false;
  }

  _highlightText(text: string): string {
    const _arrReplacement: any[] = [];
    let _newText = '';
    let _cursor = 0;

    this.config.forEach((option, index) => {
      const _positions: any[] = option.position.split('-');
      const _rowIndex = Number(_positions[0]) - 1;
      const _offset = _rowIndex * 120;
      const _start = Number(_positions[1]) - 1 + _offset;
      const _end = Number(_positions[2]) + _offset;
      const _subString = text.substring(_start, _end);
      if (_subString.length > 0) {
        _newText += text.substring(_cursor, _start);
        const _title = option.tooltip || option.label;
        const _style = option.color ? `color: ${option.color}` : '';
        _newText += `<span class="highlight-item ${option.class}" style="${_style}" title="${_title}">${_subString}<span class="highlight-tooltip">${option.label}</span></span>`;
        _arrReplacement.push({ text: _subString, replace: `<span class="${_title}" title="${option.label}">${_subString}</span>` });
      }
      _cursor = _end;
    });
    _newText += text.substring(_cursor);
    let _textResult = text;
    _arrReplacement.forEach(item => {
      _textResult = _textResult.replace(item.text, item.replace);
    });

    return _newText;
  }

  _createTextRows(text: string) {
    // WIP
    let _cursor = 0;
    let _newText = '';
    let _partial = '';

    const _rowsSplit = text.split(/\r\n|\n|\r/);

    _rowsSplit.forEach((row, index) => {
      const _rowText = row;
      const _currentIndex = index;
      const _elems: any[] = [];
      _cursor = 0;
      _newText = '';
      this.config.forEach(option => {
        const _positions: any[] = option.pr.split('-');
        const _rowIndex = Number(_positions[0]) - 1;
        if (_currentIndex === _rowIndex) {
          const _offset = 0;
          const _start = Number(_positions[1]) - 1 + _offset;
          const _end = Number(_positions[2]) + _offset;
          const _subString = _rowText.substring(_start, _end);
          if (_subString.length > 0) {
            _partial = _rowText.substring(_cursor, _start);
            _newText += _partial;
            _elems.push({ row: _currentIndex, content: _partial, type: 'text' });
            const _title = option.tooltip || option.label;
            const _style = option.color ? `color: ${option.color}` : '';
            _newText += `<span class="highlight-item ${option.class}" style="${_style}" data-bs-toggle="tooltip" data-bs-placement="top" title="${_title}">${_subString}<span class="highlight-tooltip">${option.label}</span></span>`;
            _elems.push({ row: _currentIndex, content: _subString, type: 'highlight', option: option });
          }
          _cursor = _end;
        }
      });
      _partial = _rowText.substring(_cursor);
      _newText += _partial;
      _elems.push({ row: _currentIndex, content: _partial, type: 'text' });
      this._itemList.push(_elems);
      this._displayRows.push(_newText);
    });
  }

  _decodeB64(str: string): string {
    try {
      return decodeURIComponent(atob(str).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch (e) {
      console.log('Formato non corretto');
      return '';
    }
  }
}
