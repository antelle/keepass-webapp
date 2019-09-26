import { View } from 'framework/views/view';
import { CopyPaste } from 'comp/browser/copy-paste';
import { Tip } from 'util/ui/tip';
import { isEqual } from 'util/fn';
import template from 'templates/details/field.hbs';

class FieldView extends View {
    template = template;

    events = {
        'click .details__field-label': 'fieldLabelClick',
        'click .details__field-value': 'fieldValueClick',
        'dragstart .details__field-label': 'fieldLabelDrag',
        'mouseover .details__field-value': 'fieldValueMouseOver',
        'mouseout .details__field-value': 'fieldValueMouseOut'
    };

    unsafeMode = false;
    unsafeTimeout = null;

    constructor(model, options) {
        super(model, options);
        this.once('remove', () => {
            if (this.tip) {
                Tip.hideTip(this.valueEl[0]);
            }
        });
    }

    render() {
        this.value = typeof this.model.value === 'function' ? this.model.value() : this.model.value;
        super.render({
            cls: this.cssClass,
            editable: !this.readonly,
            multiline: this.model.multiline,
            title: this.model.title,
            canEditTitle: this.model.newField,
            protect: !this.unsafeMode && this.value && this.value.isProtected
        });
        this.valueEl = this.$el.find('.details__field-value');
        this.valueEl.html(this.renderValue(this.value));
        this.labelEl = this.$el.find('.details__field-label');
        if (this.model.tip) {
            this.tip = typeof this.model.tip === 'function' ? this.model.tip() : this.model.tip;
            if (this.tip) {
                this.valueEl.attr('title', this.tip);
                Tip.createTip(this.valueEl);
            }
        }
    }

    update() {
        if (typeof this.model.value === 'function') {
            const newVal = this.model.value();
            if (
                !isEqual(newVal, this.value) ||
                (this.value && newVal && this.value.toString() !== newVal.toString())
            ) {
                this.render();
            }
        }
    }

    fieldLabelClick(e) {
        e.stopImmediatePropagation();
        if (this.preventCopy) {
            return;
        }
        const field = this.model.name;
        let copyRes;
        if (field) {
            const value = this.value || '';
            if (value && value.isProtected) {
                const text = value.getText();
                if (!text) {
                    return;
                }
                if (!CopyPaste.simpleCopy) {
                    CopyPaste.createHiddenInput(text);
                }
                copyRes = CopyPaste.copy(text);
                this.emit('copy', { source: this, copyRes });
                return;
            }
        }
        if (!this.value) {
            return;
        }
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(this.valueEl[0]);
        selection.removeAllRanges();
        selection.addRange(range);
        copyRes = CopyPaste.copy(this.valueEl[0].innerText || this.valueEl.text());
        if (copyRes) {
            selection.removeAllRanges();
            this.emit('copy', { source: this, copyRes });
        }
    }

    fieldValueClick(e) {
        if (['a', 'input', 'textarea'].indexOf(e.target.tagName.toLowerCase()) >= 0) {
            return;
        }
        const sel = window.getSelection().toString();
        if (!sel) {
            this.unsafeMode = false;
            this.edit();
        }
    }

    fieldValueMouseOver(e) {
        if (!this.editing) {
            if (!this.unsafeTimeout) {
                this.unsafeTimeout = window.setTimeout(() => {
                    this.unsafeMode = e.altKey;
                    this.render();
                }, 1000);
            }
        }
    }

    fieldValueMouseOut(e) {
        if (this.unsafeTimeout) {
            window.clearTimeout(this.unsafeTimeout);
            this.unsafeTimeout = null;
        }
        if (this.unsafeMode) {
            this.unsafeMode = false;
            this.render();
        }
    }

    fieldLabelDrag(e) {
        e.stopPropagation();
        if (!this.value) {
            return;
        }
        const dt = e.dataTransfer;
        const txtval = this.value.isProtected ? this.value.getText() : this.value;
        if (this.valueEl[0].tagName.toLowerCase() === 'a') {
            dt.setData('text/uri-list', txtval);
        }
        dt.setData('text/plain', txtval);
        dt.effectAllowed = 'copy';
    }

    edit() {
        if (this.readonly || this.editing) {
            return;
        }
        this.$el.addClass('details__field--edit');
        this.startEdit();
        this.editing = true;
        this.preventCopy = true;
        this.labelEl[0].setAttribute('draggable', 'false');
    }

    endEdit(newVal, extra) {
        if (!this.editing) {
            return;
        }
        this.editing = false;
        setTimeout(() => {
            this.preventCopy = false;
        }, 300);
        let textEqual;
        if (this.value && this.value.isProtected) {
            textEqual = this.value.equals(newVal);
        } else if (newVal && newVal.isProtected) {
            textEqual = newVal.equals(this.value);
        } else {
            textEqual = isEqual(this.value, newVal);
        }
        const protectedEqual =
            (newVal && newVal.isProtected) === (this.value && this.value.isProtected);
        const nameChanged = extra && extra.newField;
        let arg;
        if (newVal !== undefined && (!textEqual || !protectedEqual || nameChanged)) {
            arg = { val: newVal, field: this.model.name };
            if (extra) {
                Object.assign(arg, extra);
            }
        } else if (extra) {
            arg = extra;
        }
        if (arg) {
            this.triggerChange(arg);
        }
        this.valueEl.html(this.renderValue(this.value));
        this.$el.removeClass('details__field--edit');
        this.labelEl[0].setAttribute('draggable', 'true');
    }

    triggerChange(arg) {
        arg.sender = this;
        this.emit('change', arg);
    }
}

export { FieldView };
