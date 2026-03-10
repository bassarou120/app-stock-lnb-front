import * as i0 from '@angular/core';
import { Directive, EventEmitter, TemplateRef, Output, ContentChild, Input, inject, Injectable, booleanAttribute, numberAttribute, Renderer2, ElementRef, HostBinding, ChangeDetectionStrategy, Component, ChangeDetectorRef, HostListener, KeyValueDiffers, InjectionToken, ViewContainerRef, Injector, signal, IterableDiffers, ViewChild, computed, ContentChildren, NgZone, input, effect, NgModule } from '@angular/core';
import { __decorate } from 'tslib';
import { Subject, fromEvent, takeUntil as takeUntil$1 } from 'rxjs';
import { NgTemplateOutlet, NgStyle, NgClass } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import {DOCUMENT} from "@angular/common";

class DataTableFooterTemplateDirective {
    static ngTemplateContextGuard(directive, context) {
        return true;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableFooterTemplateDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "20.0.5", type: DataTableFooterTemplateDirective, isStandalone: true, selector: "[ngx-datatable-footer-template]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableFooterTemplateDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngx-datatable-footer-template]'
                }]
        }] });

class DatatableGroupHeaderTemplateDirective {
    static ngTemplateContextGuard(directive, context) {
        return true;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableGroupHeaderTemplateDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "20.0.5", type: DatatableGroupHeaderTemplateDirective, isStandalone: true, selector: "[ngx-datatable-group-header-template]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableGroupHeaderTemplateDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngx-datatable-group-header-template]'
                }]
        }] });

class DatatableGroupHeaderDirective {
    constructor() {
        /**
         * Row height is required when virtual scroll is enabled.
         */
        this.rowHeight = 0;
        /**
         * Show checkbox at group header to select all rows of the group.
         */
        this.checkboxable = false;
        /**
         * Track toggling of group visibility
         */
        this.toggle = new EventEmitter();
    }
    get template() {
        return this._templateInput || this._templateQuery;
    }
    /**
     * Toggle the expansion of a group
     */
    toggleExpandGroup(group) {
        this.toggle.emit({
            type: 'group',
            value: group
        });
    }
    /**
     * Expand all groups
     */
    expandAllGroups() {
        this.toggle.emit({
            type: 'all',
            value: true
        });
    }
    /**
     * Collapse all groups
     */
    collapseAllGroups() {
        this.toggle.emit({
            type: 'all',
            value: false
        });
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableGroupHeaderDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "20.0.5", type: DatatableGroupHeaderDirective, isStandalone: true, selector: "ngx-datatable-group-header", inputs: { rowHeight: "rowHeight", checkboxable: "checkboxable", _templateInput: ["template", "_templateInput"] }, outputs: { toggle: "toggle" }, queries: [{ propertyName: "_templateQuery", first: true, predicate: DatatableGroupHeaderTemplateDirective, descendants: true, read: TemplateRef, static: true }], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableGroupHeaderDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: 'ngx-datatable-group-header'
                }]
        }], propDecorators: { rowHeight: [{
                type: Input
            }], checkboxable: [{
                type: Input
            }], _templateInput: [{
                type: Input,
                args: ['template']
            }], _templateQuery: [{
                type: ContentChild,
                args: [DatatableGroupHeaderTemplateDirective, { read: TemplateRef, static: true }]
            }], toggle: [{
                type: Output
            }] } });

/**
 * Always returns the empty string ''
 */
function emptyStringGetter() {
    return '';
}
/**
 * Returns the appropriate getter function for this kind of prop.
 * If prop == null, returns the emptyStringGetter.
 */
function getterForProp(prop) {
    // TODO requires better typing which will also involve adjust TableColum. So postponing it.
    if (prop == null) {
        return emptyStringGetter;
    }
    if (typeof prop === 'number') {
        return numericIndexGetter;
    }
    else {
        // deep or simple
        if (prop.indexOf('.') !== -1) {
            return deepValueGetter;
        }
        else {
            return shallowValueGetter;
        }
    }
}
/**
 * Returns the value at this numeric index.
 * @param row array of values
 * @param index numeric index
 * @returns any or '' if invalid index
 */
function numericIndexGetter(row, index) {
    if (row == null) {
        return '';
    }
    // mimic behavior of deepValueGetter
    if (!row || index == null) {
        return row;
    }
    const value = row[index];
    if (value == null) {
        return '';
    }
    return value;
}
/**
 * Returns the value of a field.
 * (more efficient than deepValueGetter)
 * @param obj object containing the field
 * @param fieldName field name string
 */
function shallowValueGetter(obj, fieldName) {
    if (obj == null) {
        return '';
    }
    if (!obj || !fieldName) {
        return obj;
    }
    const value = obj[fieldName];
    if (value == null) {
        return '';
    }
    return value;
}
/**
 * Returns a deep object given a string. zoo['animal.type']
 */
function deepValueGetter(obj, path) {
    if (obj == null) {
        return '';
    }
    if (!obj || !path) {
        return obj;
    }
    // check if path matches a root-level field
    // { "a.b.c": 123 }
    let current = obj[path];
    if (current !== undefined) {
        return current;
    }
    current = obj;
    const split = path.split('.');
    if (split.length) {
        for (let i = 0; i < split.length; i++) {
            current = current[split[i]];
            // if found undefined, return empty string
            if (current === undefined || current === null) {
                return '';
            }
        }
    }
    return current;
}

function optionalGetterForProp(prop) {
    return prop ? row => getterForProp(prop)(row, prop) : undefined;
}
/**
 * This functions rearrange items by their parents
 * Also sets the level value to each of the items
 *
 * Note: Expecting each item has a property called parentId
 * Note: This algorithm will fail if a list has two or more items with same ID
 * NOTE: This algorithm will fail if there is a deadlock of relationship
 *
 * For example,
 *
 * Input
 *
 * id -> parent
 * 1  -> 0
 * 2  -> 0
 * 3  -> 1
 * 4  -> 1
 * 5  -> 2
 * 7  -> 8
 * 6  -> 3
 *
 *
 * Output
 * id -> level
 * 1      -> 0
 * --3    -> 1
 * ----6  -> 2
 * --4    -> 1
 * 2      -> 0
 * --5    -> 1
 * 7     -> 8
 *
 *
 * @param rows
 *
 */
function groupRowsByParents(rows, from, to) {
    if (from && to) {
        const treeRows = rows.filter(row => !!row).map(row => new TreeNode(row));
        const uniqIDs = new Map(treeRows.map(node => [to(node.row), node]));
        const rootNodes = treeRows.reduce((root, node) => {
            const fromValue = from(node.row);
            const parent = uniqIDs.get(fromValue);
            if (parent) {
                node.row.level = parent.row.level + 1; // TODO: should be reflected by type, that level is defined
                node.parent = parent;
                parent.children.push(node);
            }
            else {
                node.row.level = 0;
                root.push(node);
            }
            return root;
        }, []);
        return rootNodes.flatMap(child => child.flatten());
    }
    else {
        return rows;
    }
}
class TreeNode {
    constructor(row) {
        this.row = row;
        this.children = [];
    }
    flatten() {
        if (this.row.treeStatus === 'expanded') {
            return [this.row, ...this.children.flatMap(child => child.flatten())];
        }
        else {
            return [this.row];
        }
    }
}

class DataTableColumnHeaderDirective {
    static ngTemplateContextGuard(directive, context) {
        return true;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableColumnHeaderDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "20.0.5", type: DataTableColumnHeaderDirective, isStandalone: true, selector: "[ngx-datatable-header-template]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableColumnHeaderDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngx-datatable-header-template]'
                }]
        }] });

class DataTableColumnCellDirective {
    constructor() {
        this.template = inject(TemplateRef);
    }
    static ngTemplateContextGuard(dir, ctx) {
        return true;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableColumnCellDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "20.0.5", type: DataTableColumnCellDirective, isStandalone: true, selector: "[ngx-datatable-cell-template]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableColumnCellDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngx-datatable-cell-template]'
                }]
        }] });

class DataTableColumnCellTreeToggle {
    constructor() {
        this.template = inject(TemplateRef);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableColumnCellTreeToggle, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "20.0.5", type: DataTableColumnCellTreeToggle, isStandalone: true, selector: "[ngx-datatable-tree-toggle]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableColumnCellTreeToggle, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngx-datatable-tree-toggle]'
                }]
        }] });

/**
 * service to make DatatableComponent aware of changes to
 * input bindings of DataTableColumnDirective
 */
class ColumnChangesService {
    constructor() {
        this.columnInputChanges = new Subject();
    }
    get columnInputChanges$() {
        return this.columnInputChanges.asObservable();
    }
    onInputChange() {
        this.columnInputChanges.next(undefined);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: ColumnChangesService, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: ColumnChangesService }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: ColumnChangesService, decorators: [{
            type: Injectable
        }] });

class DataTableColumnGhostCellDirective {
    static ngTemplateContextGuard(directive, context) {
        return true;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableColumnGhostCellDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "20.0.5", type: DataTableColumnGhostCellDirective, isStandalone: true, selector: "[ngx-datatable-ghost-cell-template]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableColumnGhostCellDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngx-datatable-ghost-cell-template]'
                }]
        }] });

class DataTableColumnDirective {
    constructor() {
        this.columnChangesService = inject(ColumnChangesService);
        this.isFirstChange = true;
    }
    get cellTemplate() {
        return this._cellTemplateInput || this._cellTemplateQuery;
    }
    get headerTemplate() {
        return this._headerTemplateInput || this._headerTemplateQuery;
    }
    get treeToggleTemplate() {
        return this._treeToggleTemplateInput || this._treeToggleTemplateQuery;
    }
    get ghostCellTemplate() {
        return this._ghostCellTemplateInput || this._ghostCellTemplateQuery;
    }
    ngOnChanges() {
        if (this.isFirstChange) {
            this.isFirstChange = false;
        }
        else {
            this.columnChangesService.onInputChange();
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableColumnDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "20.0.5", type: DataTableColumnDirective, isStandalone: true, selector: "ngx-datatable-column", inputs: { name: "name", prop: "prop", bindAsUnsafeHtml: ["bindAsUnsafeHtml", "bindAsUnsafeHtml", booleanAttribute], frozenLeft: ["frozenLeft", "frozenLeft", booleanAttribute], frozenRight: ["frozenRight", "frozenRight", booleanAttribute], flexGrow: ["flexGrow", "flexGrow", numberAttribute], resizeable: ["resizeable", "resizeable", booleanAttribute], comparator: "comparator", pipe: "pipe", sortable: ["sortable", "sortable", booleanAttribute], draggable: ["draggable", "draggable", booleanAttribute], canAutoResize: ["canAutoResize", "canAutoResize", booleanAttribute], minWidth: ["minWidth", "minWidth", numberAttribute], width: ["width", "width", numberAttribute], maxWidth: ["maxWidth", "maxWidth", numberAttribute], checkboxable: ["checkboxable", "checkboxable", booleanAttribute], headerCheckboxable: ["headerCheckboxable", "headerCheckboxable", booleanAttribute], headerClass: "headerClass", cellClass: "cellClass", isTreeColumn: ["isTreeColumn", "isTreeColumn", booleanAttribute], treeLevelIndent: "treeLevelIndent", summaryFunc: "summaryFunc", summaryTemplate: "summaryTemplate", _cellTemplateInput: ["cellTemplate", "_cellTemplateInput"], _headerTemplateInput: ["headerTemplate", "_headerTemplateInput"], _treeToggleTemplateInput: ["treeToggleTemplate", "_treeToggleTemplateInput"], _ghostCellTemplateInput: ["ghostCellTemplate", "_ghostCellTemplateInput"] }, queries: [{ propertyName: "_cellTemplateQuery", first: true, predicate: DataTableColumnCellDirective, descendants: true, read: TemplateRef, static: true }, { propertyName: "_headerTemplateQuery", first: true, predicate: DataTableColumnHeaderDirective, descendants: true, read: TemplateRef, static: true }, { propertyName: "_treeToggleTemplateQuery", first: true, predicate: DataTableColumnCellTreeToggle, descendants: true, read: TemplateRef, static: true }, { propertyName: "_ghostCellTemplateQuery", first: true, predicate: DataTableColumnGhostCellDirective, descendants: true, read: TemplateRef, static: true }], usesOnChanges: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableColumnDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: 'ngx-datatable-column'
                }]
        }], propDecorators: { name: [{
                type: Input
            }], prop: [{
                type: Input
            }], bindAsUnsafeHtml: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], frozenLeft: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], frozenRight: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], flexGrow: [{
                type: Input,
                args: [{ transform: numberAttribute }]
            }], resizeable: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], comparator: [{
                type: Input
            }], pipe: [{
                type: Input
            }], sortable: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], draggable: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], canAutoResize: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], minWidth: [{
                type: Input,
                args: [{ transform: numberAttribute }]
            }], width: [{
                type: Input,
                args: [{ transform: numberAttribute }]
            }], maxWidth: [{
                type: Input,
                args: [{ transform: numberAttribute }]
            }], checkboxable: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], headerCheckboxable: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], headerClass: [{
                type: Input
            }], cellClass: [{
                type: Input
            }], isTreeColumn: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], treeLevelIndent: [{
                type: Input
            }], summaryFunc: [{
                type: Input
            }], summaryTemplate: [{
                type: Input
            }], _cellTemplateInput: [{
                type: Input,
                args: ['cellTemplate']
            }], _cellTemplateQuery: [{
                type: ContentChild,
                args: [DataTableColumnCellDirective, { read: TemplateRef, static: true }]
            }], _headerTemplateInput: [{
                type: Input,
                args: ['headerTemplate']
            }], _headerTemplateQuery: [{
                type: ContentChild,
                args: [DataTableColumnHeaderDirective, { read: TemplateRef, static: true }]
            }], _treeToggleTemplateInput: [{
                type: Input,
                args: ['treeToggleTemplate']
            }], _treeToggleTemplateQuery: [{
                type: ContentChild,
                args: [DataTableColumnCellTreeToggle, { read: TemplateRef, static: true }]
            }], _ghostCellTemplateInput: [{
                type: Input,
                args: ['ghostCellTemplate']
            }], _ghostCellTemplateQuery: [{
                type: ContentChild,
                args: [DataTableColumnGhostCellDirective, { read: TemplateRef, static: true }]
            }] } });

class DatatableRowDetailTemplateDirective {
    static ngTemplateContextGuard(directive, context) {
        return true;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableRowDetailTemplateDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "20.0.5", type: DatatableRowDetailTemplateDirective, isStandalone: true, selector: "[ngx-datatable-row-detail-template]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableRowDetailTemplateDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngx-datatable-row-detail-template]'
                }]
        }] });

class DatatableRowDetailDirective {
    constructor() {
        /**
         * The detail row height is required especially
         * when virtual scroll is enabled.
         */
        this.rowHeight = 0;
        /**
         * Row detail row visbility was toggled.
         */
        this.toggle = new EventEmitter();
    }
    get template() {
        return this._templateInput || this._templateQuery;
    }
    /**
     * Toggle the expansion of the row
     */
    toggleExpandRow(row) {
        this.toggle.emit({
            type: 'row',
            value: row
        });
    }
    /**
     * API method to expand all the rows.
     */
    expandAllRows() {
        this.toggle.emit({
            type: 'all',
            value: true
        });
    }
    /**
     * API method to collapse all the rows.
     */
    collapseAllRows() {
        this.toggle.emit({
            type: 'all',
            value: false
        });
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableRowDetailDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "20.0.5", type: DatatableRowDetailDirective, isStandalone: true, selector: "ngx-datatable-row-detail", inputs: { rowHeight: "rowHeight", _templateInput: ["template", "_templateInput"] }, outputs: { toggle: "toggle" }, queries: [{ propertyName: "_templateQuery", first: true, predicate: DatatableRowDetailTemplateDirective, descendants: true, read: TemplateRef, static: true }], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableRowDetailDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: 'ngx-datatable-row-detail'
                }]
        }], propDecorators: { rowHeight: [{
                type: Input
            }], _templateInput: [{
                type: Input,
                args: ['template']
            }], _templateQuery: [{
                type: ContentChild,
                args: [DatatableRowDetailTemplateDirective, { read: TemplateRef, static: true }]
            }], toggle: [{
                type: Output
            }] } });

class DatatableFooterDirective {
    get template() {
        return this._templateInput || this._templateQuery;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableFooterDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "20.0.5", type: DatatableFooterDirective, isStandalone: true, selector: "ngx-datatable-footer", inputs: { _templateInput: ["template", "_templateInput"] }, queries: [{ propertyName: "_templateQuery", first: true, predicate: DataTableFooterTemplateDirective, descendants: true, read: TemplateRef }], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableFooterDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: 'ngx-datatable-footer'
                }]
        }], propDecorators: { _templateInput: [{
                type: Input,
                args: ['template']
            }], _templateQuery: [{
                type: ContentChild,
                args: [DataTableFooterTemplateDirective, { read: TemplateRef }]
            }] } });

class ScrollerComponent {
    constructor() {
        this.renderer = inject(Renderer2);
        this.scroll = new EventEmitter();
        this.scrollYPos = 0;
        this.scrollXPos = 0;
        this.prevScrollYPos = 0;
        this.prevScrollXPos = 0;
        this.element = inject(ElementRef).nativeElement;
        this._scrollEventListener = null;
    }
    ngOnInit() {
        // manual bind so we don't always listen
        if (this.scrollbarV || this.scrollbarH) {
            const renderer = this.renderer;
            this.parentElement = renderer.parentNode(this.element);
            this._scrollEventListener = this.onScrolled.bind(this);
            this.parentElement?.addEventListener('scroll', this._scrollEventListener);
        }
    }
    ngOnDestroy() {
        if (this._scrollEventListener) {
            this.parentElement?.removeEventListener('scroll', this._scrollEventListener);
            this._scrollEventListener = null;
        }
    }
    setOffset(offsetY) {
        if (this.parentElement) {
            this.parentElement.scrollTop = offsetY;
        }
    }
    onScrolled(event) {
        const dom = event.currentTarget;
        requestAnimationFrame(() => {
            this.scrollYPos = dom.scrollTop;
            this.scrollXPos = dom.scrollLeft;
            this.updateOffset();
        });
    }
    updateOffset() {
        let direction;
        if (this.scrollYPos < this.prevScrollYPos) {
            direction = 'down';
        }
        else {
            direction = 'up';
        }
        this.scroll.emit({
            direction,
            scrollYPos: this.scrollYPos,
            scrollXPos: this.scrollXPos
        });
        this.prevScrollYPos = this.scrollYPos;
        this.prevScrollXPos = this.scrollXPos;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: ScrollerComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "20.0.5", type: ScrollerComponent, isStandalone: true, selector: "datatable-scroller", inputs: { scrollbarV: "scrollbarV", scrollbarH: "scrollbarH", scrollHeight: "scrollHeight", scrollWidth: "scrollWidth" }, outputs: { scroll: "scroll" }, host: { properties: { "style.height.px": "this.scrollHeight", "style.width.px": "this.scrollWidth" }, classAttribute: "datatable-scroll" }, ngImport: i0, template: ` <ng-content></ng-content> `, isInline: true, changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: ScrollerComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'datatable-scroller',
                    template: ` <ng-content></ng-content> `,
                    host: {
                        class: 'datatable-scroll'
                    },
                    changeDetection: ChangeDetectionStrategy.OnPush
                }]
        }], propDecorators: { scrollbarV: [{
                type: Input
            }], scrollbarH: [{
                type: Input
            }], scrollHeight: [{
                type: HostBinding,
                args: ['style.height.px']
            }, {
                type: Input
            }], scrollWidth: [{
                type: HostBinding,
                args: ['style.width.px']
            }, {
                type: Input
            }], scroll: [{
                type: Output
            }] } });

/**
 * Returns the columns by pin.
 */
function columnsByPin(cols) {
    const ret = {
        left: [],
        center: [],
        right: []
    };
    if (cols) {
        for (const col of cols) {
            if (col.frozenLeft) {
                ret.left.push(col);
            }
            else if (col.frozenRight) {
                ret.right.push(col);
            }
            else {
                ret.center.push(col);
            }
        }
    }
    return ret;
}
/**
 * Returns the widths of all group sets of a column
 */
function columnGroupWidths(groups, all) {
    return {
        left: columnTotalWidth(groups.left),
        center: columnTotalWidth(groups.center),
        right: columnTotalWidth(groups.right),
        total: Math.floor(columnTotalWidth(all))
    };
}
/**
 * Calculates the total width of all columns
 */
function columnTotalWidth(columns) {
    return columns?.reduce((total, column) => total + column.width, 0) ?? 0;
}
function columnsByPinArr(val) {
    const colsByPin = columnsByPin(val);
    return [
        { type: 'left', columns: colsByPin.left },
        { type: 'center', columns: colsByPin.center },
        { type: 'right', columns: colsByPin.right }
    ];
}

/**
 * This object contains the cache of the various row heights that are present inside
 * the data table.   Its based on Fenwick tree data structure that helps with
 * querying sums that have time complexity of log n.
 *
 * Fenwick Tree Credits: http://petr-mitrichev.blogspot.com/2013/05/fenwick-tree-range-updates.html
 * https://github.com/mikolalysenko/fenwick-tree
 *
 */
class RowHeightCache {
    constructor() {
        /**
         * Tree Array stores the cumulative information of the row heights to perform efficient
         * range queries and updates.  Currently the tree is initialized to the base row
         * height instead of the detail row height.
         */
        this.treeArray = [];
    }
    /**
     * Clear the Tree array.
     */
    clearCache() {
        this.treeArray = [];
    }
    /**
     * Initialize the Fenwick tree with row Heights.
     *
     * @param rows The array of rows which contain the expanded status.
     * @param rowHeight The row height.
     * @param detailRowHeight The detail row height.
     */
    initCache(details) {
        const { rows, rowHeight, detailRowHeight, externalVirtual, indexOffset, rowCount, rowExpansions } = details;
        const isFn = typeof rowHeight === 'function';
        const isDetailFn = typeof detailRowHeight === 'function';
        if (!isFn && isNaN(rowHeight)) {
            throw new Error(`Row Height cache initialization failed. Please ensure that 'rowHeight' is a
        valid number or function value: (${rowHeight}) when 'scrollbarV' is enabled.`);
        }
        // Add this additional guard in case detailRowHeight is set to 'auto' as it wont work.
        if (!isDetailFn && isNaN(detailRowHeight)) {
            throw new Error(`Row Height cache initialization failed. Please ensure that 'detailRowHeight' is a
        valid number or function value: (${detailRowHeight}) when 'scrollbarV' is enabled.`);
        }
        const n = externalVirtual ? rowCount : rows.length;
        this.treeArray = new Array(n);
        for (let i = 0; i < n; ++i) {
            this.treeArray[i] = 0;
        }
        for (let i = 0; i < n; ++i) {
            const row = rows[i];
            let currentRowHeight = rowHeight;
            if (isFn) {
                currentRowHeight = rowHeight(row);
            }
            // Add the detail row height to the already expanded rows.
            // This is useful for the table that goes through a filter or sort.
            const expanded = rowExpansions.has(row);
            if (row && expanded) {
                if (isDetailFn) {
                    const index = indexOffset + i;
                    currentRowHeight += detailRowHeight(row, index);
                }
                else {
                    currentRowHeight += detailRowHeight;
                }
            }
            this.update(i, currentRowHeight);
        }
    }
    /**
     * Given the ScrollY position i.e. sum, provide the rowIndex
     * that is present in the current view port.  Below handles edge cases.
     */
    getRowIndex(scrollY) {
        if (scrollY === 0) {
            return 0;
        }
        return this.calcRowIndex(scrollY);
    }
    /**
     * When a row is expanded or rowHeight is changed, update the height.  This can
     * be utilized in future when Angular Data table supports dynamic row heights.
     */
    update(atRowIndex, byRowHeight) {
        if (!this.treeArray.length) {
            throw new Error(`Update at index ${atRowIndex} with value ${byRowHeight} failed:
        Row Height cache not initialized.`);
        }
        const n = this.treeArray.length;
        atRowIndex |= 0;
        while (atRowIndex < n) {
            this.treeArray[atRowIndex] += byRowHeight;
            atRowIndex |= atRowIndex + 1;
        }
    }
    /**
     * Range Sum query from 1 to the rowIndex
     */
    query(atIndex) {
        if (!this.treeArray.length) {
            throw new Error(`query at index ${atIndex} failed: Fenwick tree array not initialized.`);
        }
        let sum = 0;
        atIndex |= 0;
        while (atIndex >= 0) {
            sum += this.treeArray[atIndex];
            atIndex = (atIndex & (atIndex + 1)) - 1;
        }
        return sum;
    }
    /**
     * Find the total height between 2 row indexes
     */
    queryBetween(atIndexA, atIndexB) {
        return this.query(atIndexB) - this.query(atIndexA - 1);
    }
    /**
     * Given the ScrollY position i.e. sum, provide the rowIndex
     * that is present in the current view port.
     */
    calcRowIndex(sum) {
        if (!this.treeArray.length) {
            return 0;
        }
        let pos = -1;
        const dataLength = this.treeArray.length;
        // Get the highest bit for the block size.
        const highestBit = Math.pow(2, dataLength.toString(2).length - 1);
        for (let blockSize = highestBit; blockSize !== 0; blockSize >>= 1) {
            const nextPos = pos + blockSize;
            if (nextPos < dataLength && sum >= this.treeArray[nextPos]) {
                sum -= this.treeArray[nextPos];
                pos = nextPos;
            }
        }
        return pos + 1;
    }
}

var Keys;
(function (Keys) {
    Keys["up"] = "ArrowUp";
    Keys["down"] = "ArrowDown";
    Keys["return"] = "Enter";
    Keys["escape"] = "Escape";
    Keys["left"] = "ArrowLeft";
    Keys["right"] = "ArrowRight";
})(Keys || (Keys = {}));

var SortDirection;
(function (SortDirection) {
    SortDirection["asc"] = "asc";
    SortDirection["desc"] = "desc";
})(SortDirection || (SortDirection = {}));
var SortType;
(function (SortType) {
    SortType["single"] = "single";
    SortType["multi"] = "multi";
})(SortType || (SortType = {}));
var ColumnMode;
(function (ColumnMode) {
    ColumnMode["standard"] = "standard";
    ColumnMode["flex"] = "flex";
    ColumnMode["force"] = "force";
})(ColumnMode || (ColumnMode = {}));
var ContextmenuType;
(function (ContextmenuType) {
    ContextmenuType["header"] = "header";
    ContextmenuType["body"] = "body";
})(ContextmenuType || (ContextmenuType = {}));
var SelectionType;
(function (SelectionType) {
    SelectionType["single"] = "single";
    SelectionType["multi"] = "multi";
    SelectionType["multiClick"] = "multiClick";
    SelectionType["cell"] = "cell";
    SelectionType["checkbox"] = "checkbox";
})(SelectionType || (SelectionType = {}));

class DataTableBodyCellComponent {
    set disabled(value) {
        this.cellContext.disabled = value;
        this._disabled = value;
    }
    get disabled() {
        return this._disabled;
    }
    set group(group) {
        this._group = group;
        this.cellContext.group = group;
        this.checkValueUpdates();
        this.cd.markForCheck();
    }
    get group() {
        return this._group;
    }
    set rowHeight(val) {
        this._rowHeight = val;
        this.cellContext.rowHeight = val;
        this.checkValueUpdates();
        this.cd.markForCheck();
    }
    get rowHeight() {
        return this._rowHeight;
    }
    set isSelected(val) {
        this._isSelected = val;
        this.cellContext.isSelected = val;
        this.cd.markForCheck();
    }
    get isSelected() {
        return this._isSelected;
    }
    set expanded(val) {
        this._expanded = val;
        this.cellContext.expanded = val;
        this.cd.markForCheck();
    }
    get expanded() {
        return this._expanded;
    }
    set rowIndex(val) {
        this._rowIndex = val;
        this.cellContext.rowIndex = val?.index;
        this.cellContext.rowInGroupIndex = val?.indexInGroup;
        this.checkValueUpdates();
        this.cd.markForCheck();
    }
    get rowIndex() {
        return this._rowIndex;
    }
    set column(column) {
        this._column = column;
        this.cellContext.column = column;
        this.checkValueUpdates();
        this.cd.markForCheck();
    }
    get column() {
        return this._column;
    }
    set row(row) {
        this._row = row;
        this.cellContext.row = row;
        this.checkValueUpdates();
        this.cd.markForCheck();
    }
    get row() {
        return this._row;
    }
    set sorts(val) {
        this._sorts = val;
        this.sortDir = this.calcSortDir(val);
    }
    get sorts() {
        return this._sorts;
    }
    set treeStatus(status) {
        if (status !== 'collapsed' &&
            status !== 'expanded' &&
            status !== 'loading' &&
            status !== 'disabled') {
            this._treeStatus = 'collapsed';
        }
        else {
            this._treeStatus = status;
        }
        this.cellContext.treeStatus = this._treeStatus;
        this.checkValueUpdates();
        this.cd.markForCheck();
    }
    get treeStatus() {
        return this._treeStatus;
    }
    get columnCssClasses() {
        let cls = 'datatable-body-cell';
        if (this.column.cellClass) {
            if (typeof this.column.cellClass === 'string') {
                cls += ' ' + this.column.cellClass;
            }
            else if (typeof this.column.cellClass === 'function') {
                const res = this.column.cellClass({
                    row: this.row,
                    group: this.group,
                    column: this.column,
                    value: this.value,
                    rowHeight: this.rowHeight
                });
                if (typeof res === 'string') {
                    cls += ' ' + res;
                }
                else if (typeof res === 'object') {
                    const keys = Object.keys(res);
                    for (const k of keys) {
                        if (res[k] === true) {
                            cls += ` ${k}`;
                        }
                    }
                }
            }
        }
        if (!this.sortDir) {
            cls += ' sort-active';
        }
        if (this.isFocused && !this._disabled) {
            cls += ' active';
        }
        if (this.sortDir === SortDirection.asc) {
            cls += ' sort-asc';
        }
        if (this.sortDir === SortDirection.desc) {
            cls += ' sort-desc';
        }
        if (this._disabled) {
            cls += ' row-disabled';
        }
        return cls;
    }
    get width() {
        return this.column.width;
    }
    get minWidth() {
        return this.column.minWidth;
    }
    get maxWidth() {
        return this.column.maxWidth;
    }
    get height() {
        const height = this.rowHeight;
        if (isNaN(height)) {
            return height;
        }
        return height + 'px';
    }
    constructor() {
        this.cd = inject(ChangeDetectorRef);
        this.activate = new EventEmitter();
        this.treeAction = new EventEmitter();
        this.isFocused = false;
        this._element = inject(ElementRef).nativeElement;
        this.cellContext = {
            onCheckboxChangeFn: (event) => this.onCheckboxChange(event),
            activateFn: (event) => this.activate.emit(event),
            row: this.row,
            group: this.group,
            value: this.value,
            column: this.column,
            rowHeight: this.rowHeight,
            isSelected: this.isSelected,
            rowIndex: this.rowIndex?.index,
            rowInGroupIndex: this.rowIndex?.indexInGroup,
            treeStatus: this.treeStatus,
            disabled: this._disabled,
            onTreeAction: () => this.onTreeAction()
        };
    }
    ngDoCheck() {
        this.checkValueUpdates();
    }
    checkValueUpdates() {
        let value = '';
        if (!this.row || !this.column || this.column.prop == undefined) {
            value = '';
        }
        else {
            const val = this.column.$$valueGetter(this.row, this.column.prop);
            const userPipe = this.column.pipe;
            if (userPipe) {
                value = userPipe.transform(val);
            }
            else if (value !== undefined) {
                value = val;
            }
        }
        if (this.value !== value) {
            this.value = value;
            this.cellContext.value = value;
            this.cellContext.disabled = this._disabled;
            this.sanitizedValue = value !== null && value !== undefined ? this.stripHtml(value) : value;
            this.cd.markForCheck();
        }
    }
    onFocus() {
        this.isFocused = true;
    }
    onBlur() {
        this.isFocused = false;
    }
    onClick(event) {
        this.activate.emit({
            type: 'click',
            event,
            row: this.row,
            group: this.group,
            rowHeight: this.rowHeight,
            column: this.column,
            value: this.value,
            cellElement: this._element
        });
    }
    onDblClick(event) {
        this.activate.emit({
            type: 'dblclick',
            event,
            row: this.row,
            group: this.group,
            rowHeight: this.rowHeight,
            column: this.column,
            value: this.value,
            cellElement: this._element
        });
    }
    onKeyDown(event) {
        const key = event.key;
        const isTargetCell = event.target === this._element;
        const isAction = key === Keys.return ||
            key === Keys.down ||
            key === Keys.up ||
            key === Keys.left ||
            key === Keys.right;
        if (isAction && isTargetCell) {
            event.preventDefault();
            event.stopPropagation();
            this.activate.emit({
                type: 'keydown',
                event,
                row: this.row,
                group: this.group,
                rowHeight: this.rowHeight,
                column: this.column,
                value: this.value,
                cellElement: this._element
            });
        }
    }
    onCheckboxChange(event) {
        this.activate.emit({
            type: 'checkbox',
            event,
            row: this.row,
            group: this.group,
            rowHeight: this.rowHeight,
            column: this.column,
            value: this.value,
            cellElement: this._element,
            treeStatus: 'collapsed'
        });
    }
    calcSortDir(sorts) {
        if (!sorts) {
            return undefined;
        }
        const sort = sorts.find(s => s.prop === this.column.prop);
        return sort?.dir;
    }
    stripHtml(html) {
        if (!html.replace) {
            return html;
        }
        return html.replace(/<\/?[^>]+(>|$)/g, '');
    }
    onTreeAction() {
        this.treeAction.emit(this.row);
    }
    calcLeftMargin(column, row) {
        const levelIndent = column.treeLevelIndent != null ? column.treeLevelIndent : 50;
        return column.isTreeColumn ? row.level * levelIndent : 0;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableBodyCellComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "20.0.5", type: DataTableBodyCellComponent, isStandalone: true, selector: "datatable-body-cell", inputs: { displayCheck: "displayCheck", disabled: "disabled", group: "group", rowHeight: "rowHeight", isSelected: "isSelected", expanded: "expanded", rowIndex: "rowIndex", column: "column", row: "row", sorts: "sorts", treeStatus: "treeStatus" }, outputs: { activate: "activate", treeAction: "treeAction" }, host: { listeners: { "focus": "onFocus()", "blur": "onBlur()", "click": "onClick($event)", "dblclick": "onDblClick($event)", "keydown": "onKeyDown($event)" }, properties: { "class": "this.columnCssClasses", "style.width.px": "this.width", "style.minWidth.px": "this.minWidth", "style.maxWidth.px": "this.maxWidth", "style.height": "this.height" } }, ngImport: i0, template: `
    <div class="datatable-body-cell-label" [style.margin-left.px]="calcLeftMargin(column, row)">
      @if (column.checkboxable && (!displayCheck || displayCheck(row, column, value))) {
      <label class="datatable-checkbox">
        <input
          type="checkbox"
          [disabled]="disabled"
          [checked]="isSelected"
          (click)="onCheckboxChange($event)"
        />
      </label>
      } @if (column.isTreeColumn) { @if (!column.treeToggleTemplate) {
      <button
        class="datatable-tree-button"
        [disabled]="treeStatus === 'disabled'"
        (click)="onTreeAction()"
        [attr.aria-label]="treeStatus"
      >
        <span>
          @if (treeStatus === 'loading') {
          <i class="icon datatable-icon-collapse"></i>
          } @if (treeStatus === 'collapsed') {
          <i class="icon datatable-icon-up"></i>
          } @if (treeStatus === 'expanded' || treeStatus === 'disabled') {
          <i class="icon datatable-icon-down"></i>
          }
        </span>
      </button>
      } @else {
      <ng-template
        [ngTemplateOutlet]="column.treeToggleTemplate"
        [ngTemplateOutletContext]="{ cellContext: cellContext }"
      >
      </ng-template>
      } } @if (!column.cellTemplate) { @if (column.bindAsUnsafeHtml) {
      <span [title]="sanitizedValue" [innerHTML]="value"> </span>
      } @else {
      <span [title]="sanitizedValue">{{ value }}</span>
      } } @else {
      <ng-template [ngTemplateOutlet]="column.cellTemplate" [ngTemplateOutletContext]="cellContext">
      </ng-template>
      }
    </div>
  `, isInline: true, styles: [":host{overflow-x:hidden;vertical-align:top;display:inline-block;line-height:1.625}:host:focus{outline:none}:host-context(ngx-datatable.fixed-row) :host{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}\n"], dependencies: [{ kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableBodyCellComponent, decorators: [{
            type: Component,
            args: [{ selector: 'datatable-body-cell', changeDetection: ChangeDetectionStrategy.OnPush, template: `
    <div class="datatable-body-cell-label" [style.margin-left.px]="calcLeftMargin(column, row)">
      @if (column.checkboxable && (!displayCheck || displayCheck(row, column, value))) {
      <label class="datatable-checkbox">
        <input
          type="checkbox"
          [disabled]="disabled"
          [checked]="isSelected"
          (click)="onCheckboxChange($event)"
        />
      </label>
      } @if (column.isTreeColumn) { @if (!column.treeToggleTemplate) {
      <button
        class="datatable-tree-button"
        [disabled]="treeStatus === 'disabled'"
        (click)="onTreeAction()"
        [attr.aria-label]="treeStatus"
      >
        <span>
          @if (treeStatus === 'loading') {
          <i class="icon datatable-icon-collapse"></i>
          } @if (treeStatus === 'collapsed') {
          <i class="icon datatable-icon-up"></i>
          } @if (treeStatus === 'expanded' || treeStatus === 'disabled') {
          <i class="icon datatable-icon-down"></i>
          }
        </span>
      </button>
      } @else {
      <ng-template
        [ngTemplateOutlet]="column.treeToggleTemplate"
        [ngTemplateOutletContext]="{ cellContext: cellContext }"
      >
      </ng-template>
      } } @if (!column.cellTemplate) { @if (column.bindAsUnsafeHtml) {
      <span [title]="sanitizedValue" [innerHTML]="value"> </span>
      } @else {
      <span [title]="sanitizedValue">{{ value }}</span>
      } } @else {
      <ng-template [ngTemplateOutlet]="column.cellTemplate" [ngTemplateOutletContext]="cellContext">
      </ng-template>
      }
    </div>
  `, imports: [NgTemplateOutlet], styles: [":host{overflow-x:hidden;vertical-align:top;display:inline-block;line-height:1.625}:host:focus{outline:none}:host-context(ngx-datatable.fixed-row) :host{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}\n"] }]
        }], ctorParameters: () => [], propDecorators: { displayCheck: [{
                type: Input
            }], disabled: [{
                type: Input
            }], group: [{
                type: Input
            }], rowHeight: [{
                type: Input
            }], isSelected: [{
                type: Input
            }], expanded: [{
                type: Input
            }], rowIndex: [{
                type: Input
            }], column: [{
                type: Input
            }], row: [{
                type: Input
            }], sorts: [{
                type: Input
            }], treeStatus: [{
                type: Input
            }], activate: [{
                type: Output
            }], treeAction: [{
                type: Output
            }], columnCssClasses: [{
                type: HostBinding,
                args: ['class']
            }], width: [{
                type: HostBinding,
                args: ['style.width.px']
            }], minWidth: [{
                type: HostBinding,
                args: ['style.minWidth.px']
            }], maxWidth: [{
                type: HostBinding,
                args: ['style.maxWidth.px']
            }], height: [{
                type: HostBinding,
                args: ['style.height']
            }], onFocus: [{
                type: HostListener,
                args: ['focus']
            }], onBlur: [{
                type: HostListener,
                args: ['blur']
            }], onClick: [{
                type: HostListener,
                args: ['click', ['$event']]
            }], onDblClick: [{
                type: HostListener,
                args: ['dblclick', ['$event']]
            }], onKeyDown: [{
                type: HostListener,
                args: ['keydown', ['$event']]
            }] } });

class DataTableBodyRowComponent {
    constructor() {
        this.cd = inject(ChangeDetectorRef);
        this.treeStatus = 'collapsed';
        this.verticalScrollVisible = false;
        this.activate = new EventEmitter();
        this.treeAction = new EventEmitter();
        this._element = inject(ElementRef).nativeElement;
        this._rowDiffer = inject(KeyValueDiffers)
            .find({})
            .create();
    }
    set columns(val) {
        this._columns = val;
        this.recalculateColumns(val);
    }
    get columns() {
        return this._columns;
    }
    set innerWidth(val) {
        if (this._columns) {
            const colByPin = columnsByPin(this._columns);
            this._columnGroupWidths = columnGroupWidths(colByPin, this._columns);
        }
        this._innerWidth = val;
        this.recalculateColumns();
    }
    get innerWidth() {
        return this._innerWidth;
    }
    get cssClass() {
        let cls = 'datatable-body-row';
        if (this.isSelected) {
            cls += ' active';
        }
        if (this.innerRowIndex % 2 !== 0) {
            cls += ' datatable-row-odd';
        }
        if (this.innerRowIndex % 2 === 0) {
            cls += ' datatable-row-even';
        }
        if (this.disabled) {
            cls += ' row-disabled';
        }
        if (this.rowClass) {
            const res = this.rowClass(this.row);
            if (typeof res === 'string') {
                cls += ` ${res}`;
            }
            else if (typeof res === 'object') {
                const keys = Object.keys(res);
                for (const k of keys) {
                    if (res[k] === true) {
                        cls += ` ${k}`;
                    }
                }
            }
        }
        return cls;
    }
    get columnsTotalWidths() {
        return this._columnGroupWidths.total;
    }
    ngOnChanges(changes) {
        if (changes.verticalScrollVisible) {
            this.recalculateColumns();
        }
    }
    ngDoCheck() {
        if (this._rowDiffer.diff(this.row)) {
            this.cd.markForCheck();
        }
    }
    onActivate(event, index) {
        this.activate.emit({ ...event, rowElement: this._element, cellIndex: index });
    }
    onKeyDown(event) {
        const key = event.key;
        const isTargetRow = event.target === this._element;
        const isAction = key === Keys.return ||
            key === Keys.down ||
            key === Keys.up ||
            key === Keys.left ||
            key === Keys.right;
        const isCtrlA = event.key === 'a' && (event.ctrlKey || event.metaKey);
        if ((isAction && isTargetRow) || isCtrlA) {
            event.preventDefault();
            event.stopPropagation();
            this.activate.emit({
                type: 'keydown',
                event,
                row: this.row,
                rowElement: this._element
            });
        }
    }
    onMouseenter(event) {
        this.activate.emit({
            type: 'mouseenter',
            event,
            row: this.row,
            rowElement: this._element
        });
    }
    recalculateColumns(val = this.columns) {
        this._columns = val;
        const colsByPin = columnsByPin(this._columns);
        this._columnsByPin = columnsByPinArr(this._columns);
        this._columnGroupWidths = columnGroupWidths(colsByPin, this._columns);
    }
    onTreeAction() {
        this.treeAction.emit();
    }
    /** Returns the row index, or if in a group, the index within a group. */
    get innerRowIndex() {
        return this.rowIndex?.indexInGroup ?? this.rowIndex?.index ?? 0;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableBodyRowComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "20.0.5", type: DataTableBodyRowComponent, isStandalone: true, selector: "datatable-body-row", inputs: { columns: "columns", innerWidth: "innerWidth", expanded: "expanded", rowClass: "rowClass", row: "row", group: "group", isSelected: "isSelected", rowIndex: "rowIndex", displayCheck: "displayCheck", treeStatus: "treeStatus", verticalScrollVisible: "verticalScrollVisible", disabled: "disabled", rowHeight: "rowHeight" }, outputs: { activate: "activate", treeAction: "treeAction" }, host: { listeners: { "keydown": "onKeyDown($event)", "mouseenter": "onMouseenter($event)" }, properties: { "class": "this.cssClass", "style.height.px": "this.rowHeight", "style.width.px": "this.columnsTotalWidths" } }, usesOnChanges: true, ngImport: i0, template: `
    @for (colGroup of _columnsByPin; track colGroup.type) { @if (colGroup.columns.length) {
    <div
      class="datatable-row-{{ colGroup.type }} datatable-row-group"
      [style.width.px]="_columnGroupWidths[colGroup.type]"
      [class.row-disabled]="disabled"
    >
      @for (column of colGroup.columns; track column.$$id; let ii = $index) {
      <datatable-body-cell
        role="cell"
        tabindex="-1"
        [row]="row"
        [group]="group"
        [expanded]="expanded"
        [isSelected]="isSelected"
        [rowIndex]="rowIndex"
        [column]="column"
        [rowHeight]="rowHeight"
        [displayCheck]="displayCheck"
        [disabled]="disabled"
        [treeStatus]="treeStatus"
        (activate)="onActivate($event, ii)"
        (treeAction)="onTreeAction()"
      >
      </datatable-body-cell>
      }
    </div>
    } }
  `, isInline: true, styles: [":host{display:flex;outline:none}:host-context(ngx-datatable.fixed-row) :host{white-space:nowrap}.datatable-row-group{display:flex;position:relative}\n"], dependencies: [{ kind: "component", type: DataTableBodyCellComponent, selector: "datatable-body-cell", inputs: ["displayCheck", "disabled", "group", "rowHeight", "isSelected", "expanded", "rowIndex", "column", "row", "sorts", "treeStatus"], outputs: ["activate", "treeAction"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableBodyRowComponent, decorators: [{
            type: Component,
            args: [{ selector: 'datatable-body-row', changeDetection: ChangeDetectionStrategy.OnPush, template: `
    @for (colGroup of _columnsByPin; track colGroup.type) { @if (colGroup.columns.length) {
    <div
      class="datatable-row-{{ colGroup.type }} datatable-row-group"
      [style.width.px]="_columnGroupWidths[colGroup.type]"
      [class.row-disabled]="disabled"
    >
      @for (column of colGroup.columns; track column.$$id; let ii = $index) {
      <datatable-body-cell
        role="cell"
        tabindex="-1"
        [row]="row"
        [group]="group"
        [expanded]="expanded"
        [isSelected]="isSelected"
        [rowIndex]="rowIndex"
        [column]="column"
        [rowHeight]="rowHeight"
        [displayCheck]="displayCheck"
        [disabled]="disabled"
        [treeStatus]="treeStatus"
        (activate)="onActivate($event, ii)"
        (treeAction)="onTreeAction()"
      >
      </datatable-body-cell>
      }
    </div>
    } }
  `, imports: [DataTableBodyCellComponent], styles: [":host{display:flex;outline:none}:host-context(ngx-datatable.fixed-row) :host{white-space:nowrap}.datatable-row-group{display:flex;position:relative}\n"] }]
        }], propDecorators: { columns: [{
                type: Input
            }], innerWidth: [{
                type: Input
            }], expanded: [{
                type: Input
            }], rowClass: [{
                type: Input
            }], row: [{
                type: Input
            }], group: [{
                type: Input
            }], isSelected: [{
                type: Input
            }], rowIndex: [{
                type: Input
            }], displayCheck: [{
                type: Input
            }], treeStatus: [{
                type: Input
            }], verticalScrollVisible: [{
                type: Input
            }], disabled: [{
                type: Input
            }], cssClass: [{
                type: HostBinding,
                args: ['class']
            }], rowHeight: [{
                type: HostBinding,
                args: ['style.height.px']
            }, {
                type: Input
            }], columnsTotalWidths: [{
                type: HostBinding,
                args: ['style.width.px']
            }], activate: [{
                type: Output
            }], treeAction: [{
                type: Output
            }], onKeyDown: [{
                type: HostListener,
                args: ['keydown', ['$event']]
            }], onMouseenter: [{
                type: HostListener,
                args: ['mouseenter', ['$event']]
            }] } });

/**
 * Extracts the position (x, y coordinates) from a MouseEvent or TouchEvent.
 *
 * @param {MouseEvent | TouchEvent} event - The event object from which to extract the position. Can be either a MouseEvent or a TouchEvent.
 * @return {{ x: number, y: number }} An object containing the x and y coordinates of the event relative to the viewport.
 */
function getPositionFromEvent(event) {
    return event instanceof MouseEvent ? event : event.changedTouches[0];
}

/**
 * Draggable Directive for Angular2
 *
 * Inspiration:
 *   https://github.com/AngularClass/angular2-examples/blob/master/rx-draggable/directives/draggable.ts
 *   http://stackoverflow.com/questions/35662530/how-to-implement-drag-and-drop-in-angular2
 *
 */
class DraggableDirective {
    constructor() {
        this.dragX = true;
        this.dragY = true;
        this.dragStart = new EventEmitter();
        this.dragging = new EventEmitter();
        this.dragEnd = new EventEmitter();
        this.element = inject(ElementRef).nativeElement;
        this.isDragging = false;
    }
    ngOnChanges(changes) {
        if (changes.dragEventTarget &&
            changes.dragEventTarget.currentValue &&
            this.dragModel.dragging) {
            this.onMousedown(changes.dragEventTarget.currentValue);
        }
    }
    ngOnDestroy() {
        this._destroySubscription();
    }
    onMouseup(event) {
        if (!this.isDragging) {
            return;
        }
        this.isDragging = false;
        this.element.classList.remove('dragging');
        if (this.subscription) {
            this._destroySubscription();
            this.dragEnd.emit({
                event,
                element: this.element,
                model: this.dragModel
            });
        }
    }
    onMousedown(event) {
        const isMouse = event instanceof MouseEvent;
        // we only want to drag the inner header text
        const isDragElm = event.target.classList.contains('draggable');
        if (isDragElm && (this.dragX || this.dragY)) {
            event.preventDefault();
            this.isDragging = true;
            const mouseDownPos = getPositionFromEvent(event);
            const mouseup = fromEvent(document, isMouse ? 'mouseup' : 'touchend');
            this.subscription = mouseup.subscribe(ev => this.onMouseup(ev));
            const mouseMoveSub = fromEvent(document, isMouse ? 'mousemove' : 'touchmove')
                .pipe(takeUntil(mouseup))
                .subscribe(ev => this.move(ev, mouseDownPos));
            this.subscription.add(mouseMoveSub);
            this.dragStart.emit({
                event,
                element: this.element,
                model: this.dragModel
            });
        }
    }
    move(event, mouseDownPos) {
        if (!this.isDragging) {
            return;
        }
        const { clientX, clientY } = getPositionFromEvent(event);
        const x = clientX - mouseDownPos.clientX;
        const y = clientY - mouseDownPos.clientY;
        if (this.dragX) {
            this.element.style.left = `${x}px`;
        }
        if (this.dragY) {
            this.element.style.top = `${y}px`;
        }
        this.element.classList.add('dragging');
        this.dragging.emit({
            event,
            element: this.element,
            model: this.dragModel
        });
    }
    _destroySubscription() {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = undefined;
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DraggableDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "20.0.5", type: DraggableDirective, isStandalone: true, selector: "[draggable]", inputs: { dragEventTarget: "dragEventTarget", dragModel: "dragModel", dragX: ["dragX", "dragX", booleanAttribute], dragY: ["dragY", "dragY", booleanAttribute] }, outputs: { dragStart: "dragStart", dragging: "dragging", dragEnd: "dragEnd" }, usesOnChanges: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DraggableDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[draggable]'
                }]
        }], propDecorators: { dragEventTarget: [{
                type: Input
            }], dragModel: [{
                type: Input
            }], dragX: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], dragY: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], dragStart: [{
                type: Output
            }], dragging: [{
                type: Output
            }], dragEnd: [{
                type: Output
            }] } });

/**
 * This component is passed as ng-template and rendered by BodyComponent.
 * BodyComponent uses rowDefInternal to first inject actual row template.
 * This component will render that actual row template.
 */
class DatatableRowDefComponent {
    constructor() {
        this.rowDef = inject(RowDefToken);
        this.rowContext = {
            ...this.rowDef.rowDefInternal,
            disabled: this.rowDef.rowDefInternalDisabled
        };
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableRowDefComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "20.0.5", type: DatatableRowDefComponent, isStandalone: true, selector: "datatable-row-def", ngImport: i0, template: `@if (rowDef.rowDefInternal.rowTemplate) {
    <ng-container
      [ngTemplateOutlet]="rowDef.rowDefInternal.rowTemplate"
      [ngTemplateOutletContext]="rowContext"
    />
  }`, isInline: true, dependencies: [{ kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }] }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableRowDefComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'datatable-row-def',
                    template: `@if (rowDef.rowDefInternal.rowTemplate) {
    <ng-container
      [ngTemplateOutlet]="rowDef.rowDefInternal.rowTemplate"
      [ngTemplateOutletContext]="rowContext"
    />
  }`,
                    imports: [NgTemplateOutlet]
                }]
        }] });
class DatatableRowDefDirective {
    static ngTemplateContextGuard(_dir, ctx) {
        return true;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableRowDefDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "20.0.5", type: DatatableRowDefDirective, isStandalone: true, selector: "[rowDef]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableRowDefDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[rowDef]'
                }]
        }] });
/**
 * @internal To be used internally by ngx-datatable.
 */
class DatatableRowDefInternalDirective {
    constructor() {
        this.vc = inject(ViewContainerRef);
    }
    ngOnInit() {
        this.vc.createEmbeddedView(this.rowDefInternal.template, {
            ...this.rowDefInternal
        }, {
            injector: Injector.create({
                providers: [
                    {
                        provide: RowDefToken,
                        useValue: this
                    }
                ]
            })
        });
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableRowDefInternalDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "20.0.5", type: DatatableRowDefInternalDirective, isStandalone: true, selector: "[rowDefInternal]", inputs: { rowDefInternal: "rowDefInternal", rowDefInternalDisabled: "rowDefInternalDisabled" }, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableRowDefInternalDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[rowDefInternal]'
                }]
        }], propDecorators: { rowDefInternal: [{
                type: Input
            }], rowDefInternalDisabled: [{
                type: Input
            }] } });
const RowDefToken = new InjectionToken('RowDef');

/**
 * This token is created to break cycling import error which occurs when we import
 * DatatableComponent in DataTableRowWrapperComponent.
 */
const DatatableComponentToken = new InjectionToken('DatatableComponentToken');

class DataTableRowWrapperComponent {
    constructor() {
        this.rowContextmenu = new EventEmitter(false);
        this.selectedGroupRows = signal([]);
        this.expanded = false;
        this.rowDiffer = inject(KeyValueDiffers)
            .find({})
            .create();
        this.iterableDiffers = inject(IterableDiffers);
        this.tableComponent = inject(DatatableComponentToken);
        this.cd = inject(ChangeDetectorRef);
    }
    ngOnInit() {
        this.selectedRowsDiffer = this.iterableDiffers.find(this.selected ?? []).create();
    }
    ngOnChanges(changes) {
        if (changes['row']) {
            // this component renders either a group header or a row. Never both.
            if (this.isGroup(this.row)) {
                this.context = {
                    group: this.row,
                    expanded: this.expanded,
                    rowIndex: this.rowIndex
                };
            }
            else {
                this.context = {
                    row: this.row,
                    expanded: this.expanded,
                    rowIndex: this.rowIndex,
                    disabled: this.disabled
                };
            }
        }
        if (changes['rowIndex']) {
            this.context.rowIndex = this.rowIndex;
        }
        if (changes['expanded']) {
            this.context.expanded = this.expanded;
        }
    }
    ngDoCheck() {
        if (this.rowDiffer.diff(this.row)) {
            if ('group' in this.context) {
                this.context.group = this.row;
            }
            else {
                this.context.row = this.row;
            }
            this.cd.markForCheck();
        }
        // When groupheader is used with chechbox we use iterableDiffer
        // on currently selected rows to check if it is modified
        // if any of the row of this group is not present in `selected` rows array
        // mark group header checkbox state as indeterminate
        if (this.isGroup(this.row) &&
            this.groupHeader?.checkboxable &&
            this.selectedRowsDiffer.diff(this.selected)) {
            const thisRow = this.row;
            const selectedRows = this.selected.filter(row => thisRow.value.find((item) => item === row));
            if (this.checkBoxInput) {
                if (selectedRows.length && selectedRows.length !== this.row.value.length) {
                    this.checkBoxInput.nativeElement.indeterminate = true;
                }
                else {
                    this.checkBoxInput.nativeElement.indeterminate = false;
                }
            }
            this.selectedGroupRows.set(selectedRows);
        }
    }
    onContextmenu($event) {
        this.rowContextmenu.emit({ event: $event, row: this.row });
    }
    onCheckboxChange(groupSelected, group) {
        // First remove all rows of this group from `selected`
        this.selected = [
            ...this.selected.filter(row => !group.value.find((item) => item === row))
        ];
        // If checkbox is checked then add all rows of this group in `selected`
        if (groupSelected) {
            this.selected = [...this.selected, ...group.value];
        }
        // Update `selected` of DatatableComponent with newly evaluated `selected`
        this.tableComponent.selected = [...this.selected];
        // Emit select event with updated values
        this.tableComponent.onBodySelect({
            selected: this.selected
        });
    }
    isGroup(row) {
        return !!this.groupHeader;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableRowWrapperComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "20.0.5", type: DataTableRowWrapperComponent, isStandalone: true, selector: "datatable-row-wrapper", inputs: { innerWidth: "innerWidth", rowDetail: "rowDetail", groupHeader: "groupHeader", offsetX: "offsetX", detailRowHeight: "detailRowHeight", groupHeaderRowHeight: "groupHeaderRowHeight", row: "row", groupedRows: "groupedRows", selected: "selected", disabled: "disabled", rowIndex: "rowIndex", expanded: ["expanded", "expanded", booleanAttribute] }, outputs: { rowContextmenu: "rowContextmenu" }, host: { listeners: { "contextmenu": "onContextmenu($event)" }, classAttribute: "datatable-row-wrapper" }, viewQueries: [{ propertyName: "checkBoxInput", first: true, predicate: ["select"], descendants: true }], usesOnChanges: true, ngImport: i0, template: `
    @if (isGroup(row) && groupHeader?.template) {
    <div
      class="datatable-group-header"
      [style.height.px]="groupHeaderRowHeight"
      [style.width.px]="innerWidth"
    >
      <div class="datatable-group-cell">
        @if (groupHeader!.checkboxable) {
        <div>
          <label class="datatable-checkbox">
            <input
              #select
              type="checkbox"
              [checked]="selectedGroupRows().length === row.value.length"
              (change)="onCheckboxChange(select.checked, row)"
            />
          </label>
        </div>
        }
        <ng-template
          [ngTemplateOutlet]="groupHeader!.template!"
          [ngTemplateOutletContext]="context"
        >
        </ng-template>
      </div>
    </div>
    } @if ((groupHeader?.template && expanded) || !groupHeader || !groupHeader.template) {
    <ng-content> </ng-content>
    } @if (rowDetail?.template && expanded) {
    <div [style.height.px]="detailRowHeight" class="datatable-row-detail">
      <ng-template [ngTemplateOutlet]="rowDetail!.template!" [ngTemplateOutletContext]="context">
      </ng-template>
    </div>
    }
  `, isInline: true, styles: [":host{display:flex;flex-direction:column}.datatable-row-detail{overflow-y:hidden}\n"], dependencies: [{ kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableRowWrapperComponent, decorators: [{
            type: Component,
            args: [{ selector: 'datatable-row-wrapper', changeDetection: ChangeDetectionStrategy.OnPush, template: `
    @if (isGroup(row) && groupHeader?.template) {
    <div
      class="datatable-group-header"
      [style.height.px]="groupHeaderRowHeight"
      [style.width.px]="innerWidth"
    >
      <div class="datatable-group-cell">
        @if (groupHeader!.checkboxable) {
        <div>
          <label class="datatable-checkbox">
            <input
              #select
              type="checkbox"
              [checked]="selectedGroupRows().length === row.value.length"
              (change)="onCheckboxChange(select.checked, row)"
            />
          </label>
        </div>
        }
        <ng-template
          [ngTemplateOutlet]="groupHeader!.template!"
          [ngTemplateOutletContext]="context"
        >
        </ng-template>
      </div>
    </div>
    } @if ((groupHeader?.template && expanded) || !groupHeader || !groupHeader.template) {
    <ng-content> </ng-content>
    } @if (rowDetail?.template && expanded) {
    <div [style.height.px]="detailRowHeight" class="datatable-row-detail">
      <ng-template [ngTemplateOutlet]="rowDetail!.template!" [ngTemplateOutletContext]="context">
      </ng-template>
    </div>
    }
  `, host: {
                        class: 'datatable-row-wrapper'
                    }, imports: [NgTemplateOutlet], styles: [":host{display:flex;flex-direction:column}.datatable-row-detail{overflow-y:hidden}\n"] }]
        }], propDecorators: { checkBoxInput: [{
                type: ViewChild,
                args: ['select']
            }], innerWidth: [{
                type: Input
            }], rowDetail: [{
                type: Input
            }], groupHeader: [{
                type: Input
            }], offsetX: [{
                type: Input
            }], detailRowHeight: [{
                type: Input
            }], groupHeaderRowHeight: [{
                type: Input
            }], row: [{
                type: Input
            }], groupedRows: [{
                type: Input
            }], selected: [{
                type: Input
            }], disabled: [{
                type: Input
            }], rowContextmenu: [{
                type: Output
            }], rowIndex: [{
                type: Input
            }], expanded: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], onContextmenu: [{
                type: HostListener,
                args: ['contextmenu', ['$event']]
            }] } });

function defaultSumFunc(cells) {
    const cellsWithValues = cells.filter(cell => !!cell);
    if (!cellsWithValues.length) {
        return null;
    }
    if (cellsWithValues.some(cell => typeof cell !== 'number')) {
        return null;
    }
    return cellsWithValues.reduce((res, cell) => res + cell);
}
function noopSumFunc(cells) {
    return;
}
class DataTableSummaryRowComponent {
    constructor() {
        this.summaryRow = {};
    }
    ngOnChanges() {
        if (!this.columns.length || !this.rows.length) {
            return;
        }
        this.updateInternalColumns();
        this.updateValues();
    }
    updateInternalColumns() {
        this._internalColumns = this.columns.map(col => ({
            ...col,
            cellTemplate: col.summaryTemplate
        }));
    }
    updateValues() {
        this.summaryRow = {};
        this.columns
            .filter(col => !col.summaryTemplate && col.prop)
            .forEach(col => {
            const cellsFromSingleColumn = this.rows.map(row => row[col.prop]);
            const sumFunc = this.getSummaryFunction(col);
            this.summaryRow[col.prop] = col.pipe
                ? col.pipe.transform(sumFunc(cellsFromSingleColumn))
                : sumFunc(cellsFromSingleColumn);
        });
    }
    getSummaryFunction(column) {
        if (column.summaryFunc === undefined) {
            return defaultSumFunc;
        }
        else if (column.summaryFunc === null) {
            return noopSumFunc;
        }
        else {
            return column.summaryFunc;
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableSummaryRowComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "20.0.5", type: DataTableSummaryRowComponent, isStandalone: true, selector: "datatable-summary-row", inputs: { rows: "rows", columns: "columns", rowHeight: "rowHeight", innerWidth: "innerWidth" }, host: { classAttribute: "datatable-summary-row" }, usesOnChanges: true, ngImport: i0, template: `
    @if (summaryRow && _internalColumns) {
    <datatable-body-row
      tabindex="-1"
      [innerWidth]="innerWidth"
      [columns]="_internalColumns"
      [rowHeight]="rowHeight"
      [row]="summaryRow"
      [rowIndex]="{ index: -1 }"
    >
    </datatable-body-row>
    }
  `, isInline: true, dependencies: [{ kind: "component", type: DataTableBodyRowComponent, selector: "datatable-body-row", inputs: ["columns", "innerWidth", "expanded", "rowClass", "row", "group", "isSelected", "rowIndex", "displayCheck", "treeStatus", "verticalScrollVisible", "disabled", "rowHeight"], outputs: ["activate", "treeAction"] }] }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableSummaryRowComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'datatable-summary-row',
                    template: `
    @if (summaryRow && _internalColumns) {
    <datatable-body-row
      tabindex="-1"
      [innerWidth]="innerWidth"
      [columns]="_internalColumns"
      [rowHeight]="rowHeight"
      [row]="summaryRow"
      [rowIndex]="{ index: -1 }"
    >
    </datatable-body-row>
    }
  `,
                    host: {
                        class: 'datatable-summary-row'
                    },
                    imports: [DataTableBodyRowComponent]
                }]
        }], propDecorators: { rows: [{
                type: Input
            }], columns: [{
                type: Input
            }], rowHeight: [{
                type: Input
            }], innerWidth: [{
                type: Input
            }] } });

class DataTableGhostLoaderComponent {
    constructor() {
        this.cellMode = false;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableGhostLoaderComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "20.0.5", type: DataTableGhostLoaderComponent, isStandalone: true, selector: "ghost-loader", inputs: { columns: "columns", pageSize: ["pageSize", "pageSize", numberAttribute], rowHeight: "rowHeight", ghostBodyHeight: ["ghostBodyHeight", "ghostBodyHeight", numberAttribute], cellMode: ["cellMode", "cellMode", booleanAttribute] }, ngImport: i0, template: "<div [style.height.px]=\"ghostBodyHeight\" class=\"ghost-loader ghost-cell-container\">\n  @for (item of [].constructor(pageSize); track item) {\n  <div [style.height.px]=\"rowHeight\" class=\"ghost-element\" [class.datatable-body-row]=\"cellMode\">\n    @for (col of columns; track col) {\n    <div class=\"ghost-cell\" [class.datatable-body-cell]=\"cellMode\" [style.width.px]=\"col.width\">\n      @if (!col.ghostCellTemplate) {\n      <div class=\"line ghost-cell-strip\"></div>\n      } @else {\n      <ng-template [ngTemplateOutlet]=\"col.ghostCellTemplate\"></ng-template>\n      }\n    </div>\n    }\n  </div>\n  }\n</div>\n", styles: ["@keyframes ghost{0%{background-position:0vw 0}to{background-position:100vw 0}}.ghost-loader{overflow:hidden}.ghost-loader .line{width:100%;height:12px;animation-name:ghost;animation-iteration-count:infinite;animation-timing-function:linear}.ghost-loader .ghost-element{display:flex;align-items:center}:host.ghost-overlay{position:sticky;top:20px}:host.ghost-overlay .ghost-cell{padding-inline:1.2rem}\n"], dependencies: [{ kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableGhostLoaderComponent, decorators: [{
            type: Component,
            args: [{ selector: `ghost-loader`, changeDetection: ChangeDetectionStrategy.OnPush, imports: [NgTemplateOutlet], template: "<div [style.height.px]=\"ghostBodyHeight\" class=\"ghost-loader ghost-cell-container\">\n  @for (item of [].constructor(pageSize); track item) {\n  <div [style.height.px]=\"rowHeight\" class=\"ghost-element\" [class.datatable-body-row]=\"cellMode\">\n    @for (col of columns; track col) {\n    <div class=\"ghost-cell\" [class.datatable-body-cell]=\"cellMode\" [style.width.px]=\"col.width\">\n      @if (!col.ghostCellTemplate) {\n      <div class=\"line ghost-cell-strip\"></div>\n      } @else {\n      <ng-template [ngTemplateOutlet]=\"col.ghostCellTemplate\"></ng-template>\n      }\n    </div>\n    }\n  </div>\n  }\n</div>\n", styles: ["@keyframes ghost{0%{background-position:0vw 0}to{background-position:100vw 0}}.ghost-loader{overflow:hidden}.ghost-loader .line{width:100%;height:12px;animation-name:ghost;animation-iteration-count:infinite;animation-timing-function:linear}.ghost-loader .ghost-element{display:flex;align-items:center}:host.ghost-overlay{position:sticky;top:20px}:host.ghost-overlay .ghost-cell{padding-inline:1.2rem}\n"] }]
        }], propDecorators: { columns: [{
                type: Input
            }], pageSize: [{
                type: Input,
                args: [{ transform: numberAttribute }]
            }], rowHeight: [{
                type: Input
            }], ghostBodyHeight: [{
                type: Input,
                args: [{ transform: numberAttribute }]
            }], cellMode: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }] } });

class DatatableBodyRowDirective {
    static ngTemplateContextGuard(directive, context) {
        return true;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableBodyRowDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "20.0.5", type: DatatableBodyRowDirective, isStandalone: true, selector: "[ngx-datatable-body-row]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableBodyRowDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngx-datatable-body-row]'
                }]
        }] });

function selectRows(selected, row, comparefn) {
    const selectedIndex = comparefn(row, selected);
    if (selectedIndex > -1) {
        selected.splice(selectedIndex, 1);
    }
    else {
        selected.push(row);
    }
    return selected;
}
function selectRowsBetween(selected, rows, index, prevIndex) {
    const reverse = index < prevIndex;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const greater = i >= prevIndex && i <= index;
        const lesser = i <= prevIndex && i >= index;
        let range = { start: 0, end: 0 };
        if (reverse) {
            range = {
                start: index,
                end: prevIndex
            };
        }
        else {
            range = {
                start: prevIndex,
                end: index + 1
            };
        }
        if ((reverse && lesser) || (!reverse && greater)) {
            // if in the positive range to be added to `selected`, and
            // not already in the selected array, add it
            if (i >= range.start && i <= range.end && row) {
                selected.push(row);
            }
        }
    }
    return selected;
}

class DataTableBodyComponent {
    set pageSize(val) {
        if (val !== this._pageSize) {
            this._pageSize = val;
            this.recalcLayout();
            // Emits the page event if page size has been changed
            this._offsetEvent = -1;
            this.updatePage('up');
            this.updatePage('down');
        }
    }
    get pageSize() {
        return this._pageSize;
    }
    set rows(val) {
        if (val !== this._rows) {
            this._rows = val;
            this.recalcLayout();
        }
    }
    get rows() {
        return this._rows;
    }
    set columns(val) {
        if (val !== this._columns) {
            this._columns = val;
            this.updateColumnGroupWidths();
        }
    }
    get columns() {
        return this._columns;
    }
    set offset(val) {
        if (val !== this._offset) {
            this._offset = val;
            if (!this.scrollbarV || (this.scrollbarV && !this.virtualization)) {
                this.recalcLayout();
            }
        }
    }
    get offset() {
        return this._offset;
    }
    set rowCount(val) {
        if (val !== this._rowCount) {
            this._rowCount = val;
            this.recalcLayout();
        }
    }
    get rowCount() {
        return this._rowCount;
    }
    get bodyWidth() {
        if (this.scrollbarH) {
            return this.innerWidth + 'px';
        }
        else {
            return '100%';
        }
    }
    set bodyHeight(val) {
        if (this.scrollbarV) {
            this._bodyHeight = val + 'px';
        }
        else {
            this._bodyHeight = 'auto';
        }
        this.recalcLayout();
    }
    get bodyHeight() {
        return this._bodyHeight;
    }
    /**
     * Returns if selection is enabled.
     */
    get selectEnabled() {
        return !!this.selectionType;
    }
    /**
     * Creates an instance of DataTableBodyComponent.
     */
    constructor() {
        this.cd = inject(ChangeDetectorRef);
        this.selected = [];
        this.verticalScrollVisible = false;
        this.scroll = new EventEmitter();
        this.page = new EventEmitter();
        this.activate = new EventEmitter();
        this.select = new EventEmitter();
        this.rowContextmenu = new EventEmitter(false);
        this.treeAction = new EventEmitter();
        /**
         * Property that would calculate the height of scroll bar
         * based on the row heights cache for virtual scroll and virtualization. Other scenarios
         * calculate scroll height automatically (as height will be undefined).
         */
        this.scrollHeight = computed(() => {
            if (this.rowHeightsCache() && this.scrollbarV && this.virtualization && this.rowCount) {
                return this.rowHeightsCache().query(this.rowCount - 1);
            }
            // avoid TS7030: Not all code paths return a value.
            return undefined;
        });
        this.rowsToRender = computed(() => {
            return this.updateRows();
        });
        this.rowHeightsCache = signal(new RowHeightCache());
        this.offsetY = 0;
        this.indexes = signal({ first: 0, last: 0 });
        this.rowExpansions = [];
        this._offsetEvent = -1;
        /**
         * Get the height of the detail row.
         */
        this.getDetailRowHeight = (row, index) => {
            if (!this.rowDetail) {
                return 0;
            }
            const rowHeight = this.rowDetail.rowHeight;
            return typeof rowHeight === 'function' ? rowHeight(row, index) : rowHeight;
        };
        this.getGroupHeaderRowHeight = (row, index) => {
            if (!this.groupHeader) {
                return 0;
            }
            const rowHeight = this.groupHeader?.rowHeight === 0 ? this.rowHeight : this.groupHeader?.rowHeight;
            return typeof rowHeight === 'function' ? rowHeight(row, index) : rowHeight;
        };
        /**
         * Calculates the offset of the rendered rows.
         * As virtual rows are not shown, we have to move all rendered rows
         * by the total size of previous non-rendered rows.
         * If each row has a size of 10px and the first 10 rows are not rendered due to scroll,
         * then we have a renderOffset of 100px.
         */
        this.renderOffset = computed(() => {
            if (this.scrollbarV && this.virtualization) {
                return `translateY(${this.rowHeightsCache().query(this.indexes().first - 1)}px)`;
            }
            else {
                return '';
            }
        });
        // declare fn here so we can get access to the `this` property
        this.rowTrackingFn = (index, row) => {
            if (this.ghostLoadingIndicator) {
                return index;
            }
            if (this.trackByProp && row) {
                return row[this.trackByProp];
            }
            else {
                return row;
            }
        };
    }
    /**
     * Called after the constructor, initializing input properties
     */
    ngOnInit() {
        if (this.rowDetail) {
            this.listener = this.rowDetail.toggle.subscribe(({ type, value }) => this.toggleStateChange(type, value));
        }
        if (this.groupHeader) {
            this.listener = this.groupHeader.toggle.subscribe(({ type, value }) => {
                // Remove default expansion state once user starts manual toggle.
                this.groupExpansionDefault = false;
                this.toggleStateChange(type, value);
            });
        }
    }
    toggleStateChange(type, value) {
        if (type === 'group' || type === 'row') {
            this.toggleRowExpansion(value);
        }
        if (type === 'all') {
            this.toggleAllRows(value);
        }
        // Refresh rows after toggle
        // Fixes #883
        this.updateIndexes();
        this.cd.markForCheck();
    }
    /**
     * Called once, before the instance is destroyed.
     */
    ngOnDestroy() {
        if (this.rowDetail || this.groupHeader) {
            this.listener.unsubscribe();
        }
    }
    /**
     * Updates the Y offset given a new offset.
     */
    updateOffsetY(offset) {
        // scroller is missing on empty table
        if (!this.scroller) {
            return;
        }
        if (this.scrollbarV && this.virtualization && offset) {
            // First get the row Index that we need to move to.
            const rowIndex = this.pageSize * offset;
            offset = this.rowHeightsCache().query(rowIndex - 1);
        }
        else if (this.scrollbarV && !this.virtualization) {
            offset = 0;
        }
        this.scroller.setOffset(offset || 0);
    }
    /**
     * Body was scrolled, this is mainly useful for
     * when a user is server-side pagination via virtual scroll.
     */
    onBodyScroll(event) {
        const scrollYPos = event.scrollYPos;
        const scrollXPos = event.scrollXPos;
        // if scroll change, trigger update
        // this is mainly used for header cell positions
        if (this.offsetY !== scrollYPos || this.offsetX !== scrollXPos) {
            this.scroll.emit({
                offsetY: scrollYPos,
                offsetX: scrollXPos
            });
        }
        this.offsetY = scrollYPos;
        this.offsetX = scrollXPos;
        this.updateIndexes();
        this.updatePage(event.direction);
        this.cd.detectChanges();
    }
    /**
     * Updates the page given a direction.
     */
    updatePage(direction) {
        let offset = this.indexes().first / this.pageSize;
        const scrollInBetween = !Number.isInteger(offset);
        if (direction === 'up') {
            offset = Math.ceil(offset);
        }
        else if (direction === 'down') {
            offset = Math.floor(offset);
        }
        if (direction !== undefined && !isNaN(offset) && offset !== this._offsetEvent) {
            this._offsetEvent = offset;
            // if scroll was done by mouse drag make sure previous row and next row data is also fetched if its not fetched
            if (scrollInBetween && this.scrollbarV && this.virtualization && this.externalPaging) {
                const upRow = this.rows[this.indexes().first - 1];
                if (!upRow && direction === 'up') {
                    this.page.emit(offset - 1);
                }
                const downRow = this.rows[this.indexes().first + this.pageSize];
                if (!downRow && direction === 'down') {
                    this.page.emit(offset + 1);
                }
            }
            this.page.emit(offset);
        }
    }
    /**
     * Updates the rows in the view port
     */
    updateRows() {
        const { first, last } = this.indexes();
        // if grouprowsby has been specified treat row paging
        // parameters as group paging parameters ie if limit 10 has been
        // specified treat it as 10 groups rather than 10 rows
        const rows = this.groupedRows
            ? this.groupedRows.slice(first, Math.min(last, this.groupedRows.length))
            : this.rows.slice(first, Math.min(last, this.rowCount));
        rows.length = last - first;
        return rows;
    }
    /**
     * Get the row height
     */
    getRowHeight(row) {
        // if its a function return it
        if (typeof this.rowHeight === 'function') {
            return this.rowHeight(row);
        }
        return this.rowHeight;
    }
    /**
     * @param group the group with all rows
     */
    getGroupHeight(group) {
        let rowHeight = 0;
        if (group.value) {
            // eslint-disable-next-line @typescript-eslint/prefer-for-of
            for (let index = 0; index < group.value.length; index++) {
                rowHeight += this.getRowAndDetailHeight(group.value[index]);
            }
        }
        return rowHeight;
    }
    /**
     * Calculate row height based on the expanded state of the row.
     */
    getRowAndDetailHeight(row) {
        let rowHeight = this.getRowHeight(row);
        const expanded = this.getRowExpanded(row);
        // Adding detail row height if its expanded.
        if (expanded) {
            rowHeight += this.getDetailRowHeight(row);
        }
        return rowHeight;
    }
    /**
     * Updates the index of the rows in the viewport
     */
    updateIndexes() {
        let first = 0;
        let last = 0;
        if (this.scrollbarV) {
            if (this.virtualization) {
                // Calculation of the first and last indexes will be based on where the
                // scrollY position would be at.  The last index would be the one
                // that shows up inside the view port the last.
                const height = parseInt(this._bodyHeight, 10);
                first = this.rowHeightsCache().getRowIndex(this.offsetY);
                last = this.rowHeightsCache().getRowIndex(height + this.offsetY) + 1;
            }
            else {
                // If virtual rows are not needed
                // We render all in one go
                first = 0;
                last = this.rowCount;
            }
        }
        else {
            // The server is handling paging and will pass an array that begins with the
            // element at a specified offset.  first should always be 0 with external paging.
            if (!this.externalPaging) {
                first = Math.max(this.offset * this.pageSize, 0);
            }
            last = Math.min(first + this.pageSize, this.rowCount);
        }
        this.indexes.set({ first, last });
    }
    /**
     * Refreshes the full Row Height cache.  Should be used
     * when the entire row array state has changed.
     */
    refreshRowHeightCache() {
        if (!this.scrollbarV || (this.scrollbarV && !this.virtualization)) {
            return;
        }
        // clear the previous row height cache if already present.
        // this is useful during sorts, filters where the state of the
        // rows array is changed.
        this.rowHeightsCache().clearCache();
        // Initialize the tree only if there are rows inside the tree.
        if (this.rows.length) {
            const rowExpansions = new Set();
            if (this.rowDetail) {
                for (const row of this.rows) {
                    if (row && this.getRowExpanded(row)) {
                        rowExpansions.add(row);
                    }
                }
            }
            this.rowHeightsCache().initCache({
                rows: this.rows,
                rowHeight: this.rowHeight,
                detailRowHeight: this.getDetailRowHeight,
                externalVirtual: this.scrollbarV && this.externalPaging,
                indexOffset: this.indexes().first,
                rowCount: this.rowCount,
                rowExpansions
            });
            this.rowHeightsCache.set(Object.create(this.rowHeightsCache()));
        }
    }
    /**
     * Toggle the Expansion of the row i.e. if the row is expanded then it will
     * collapse and vice versa.   Note that the expanded status is stored as
     * a part of the row object itself as we have to preserve the expanded row
     * status in case of sorting and filtering of the row set.
     */
    toggleRowExpansion(row) {
        const rowExpandedIdx = this.getRowExpandedIdx(row, this.rowExpansions);
        const expanded = rowExpandedIdx > -1;
        // Update the toggled row and update thive nevere heights in the cache.
        if (expanded) {
            this.rowExpansions.splice(rowExpandedIdx, 1);
        }
        else {
            this.rowExpansions.push(row);
        }
        // If the detailRowHeight is auto --> only in case of non-virtualized scroll
        if (this.scrollbarV && this.virtualization) {
            this.refreshRowHeightCache();
        }
    }
    /**
     * Expand/Collapse all the rows no matter what their state is.
     */
    toggleAllRows(expanded) {
        // clear prev expansions
        this.rowExpansions = [];
        const rows = this.groupedRows ?? this.rows;
        if (expanded) {
            for (const row of rows) {
                this.rowExpansions.push(row);
            }
        }
        if (this.scrollbarV) {
            // Refresh the full row heights cache since every row was affected.
            this.recalcLayout();
        }
    }
    /**
     * Recalculates the table
     */
    recalcLayout() {
        this.refreshRowHeightCache();
        this.updateIndexes();
    }
    /**
     * Returns if the row was expanded and set default row expansion when row expansion is empty
     */
    getRowExpanded(row) {
        if (this.rowExpansions.length === 0 && this.groupExpansionDefault) {
            for (const group of this.groupedRows) {
                this.rowExpansions.push(group);
            }
        }
        return this.getRowExpandedIdx(row, this.rowExpansions) > -1;
    }
    getRowExpandedIdx(row, expanded) {
        if (!expanded || !expanded.length) {
            return -1;
        }
        const rowId = this.rowIdentity(row);
        return expanded.findIndex(r => {
            const id = this.rowIdentity(r);
            return id === rowId;
        });
    }
    onTreeAction(row) {
        this.treeAction.emit({ row });
    }
    dragOver(event, dropRow) {
        event.preventDefault();
        this.rowDragEvents.emit({
            event,
            srcElement: this._draggedRowElement,
            eventType: 'dragover',
            dragRow: this._draggedRow,
            dropRow
        });
    }
    drag(event, dragRow, rowComponent) {
        this._draggedRow = dragRow;
        this._draggedRowElement = rowComponent._element;
        this.rowDragEvents.emit({
            event,
            srcElement: this._draggedRowElement,
            eventType: 'dragstart',
            dragRow
        });
    }
    drop(event, dropRow, rowComponent) {
        event.preventDefault();
        this.rowDragEvents.emit({
            event,
            srcElement: this._draggedRowElement,
            targetElement: rowComponent._element,
            eventType: 'drop',
            dragRow: this._draggedRow,
            dropRow
        });
    }
    dragEnter(event, dropRow, rowComponent) {
        event.preventDefault();
        this.rowDragEvents.emit({
            event,
            srcElement: this._draggedRowElement,
            targetElement: rowComponent._element,
            eventType: 'dragenter',
            dragRow: this._draggedRow,
            dropRow
        });
    }
    dragLeave(event, dropRow, rowComponent) {
        event.preventDefault();
        this.rowDragEvents.emit({
            event,
            srcElement: this._draggedRowElement,
            targetElement: rowComponent._element,
            eventType: 'dragleave',
            dragRow: this._draggedRow,
            dropRow
        });
    }
    dragEnd(event, dragRow) {
        event.preventDefault();
        this.rowDragEvents.emit({
            event,
            srcElement: this._draggedRowElement,
            eventType: 'dragend',
            dragRow
        });
        this._draggedRow = undefined;
        this._draggedRowElement = undefined;
    }
    updateColumnGroupWidths() {
        const colsByPin = columnsByPin(this._columns);
        this.columnGroupWidths = columnGroupWidths(colsByPin, this._columns);
    }
    selectRow(event, index, row) {
        if (!this.selectEnabled) {
            return;
        }
        const chkbox = this.selectionType === SelectionType.checkbox;
        const multi = this.selectionType === SelectionType.multi;
        const multiClick = this.selectionType === SelectionType.multiClick;
        let selected = [];
        // TODO: this code needs cleanup. Casting it to KeyboardEvent is not correct as it could also be other types.
        if (multi || chkbox || multiClick) {
            if (event.shiftKey) {
                selected = selectRowsBetween([], this.rows, index, this.prevIndex);
            }
            else if (event.key === 'a' &&
                (event.ctrlKey || event.metaKey)) {
                // select all rows except dummy rows which are added for ghostloader in case of virtual scroll
                selected = this.rows.filter(rowItem => !!rowItem);
            }
            else if (event.ctrlKey ||
                event.metaKey ||
                multiClick ||
                chkbox) {
                selected = selectRows([...this.selected], row, this.getRowSelectedIdx.bind(this));
            }
            else {
                selected = selectRows([], row, this.getRowSelectedIdx.bind(this));
            }
        }
        else {
            selected = selectRows([], row, this.getRowSelectedIdx.bind(this));
        }
        if (typeof this.selectCheck === 'function') {
            selected = selected.filter(this.selectCheck.bind(this));
        }
        if (typeof this.disableRowCheck === 'function') {
            selected = selected.filter(rowData => !this.disableRowCheck(rowData));
        }
        this.selected.splice(0, this.selected.length);
        this.selected.push(...selected);
        this.prevIndex = index;
        this.select.emit({
            selected
        });
    }
    onActivate(model, index) {
        const { type, event, row } = model;
        const chkbox = this.selectionType === SelectionType.checkbox;
        const select = (!chkbox && (type === 'click' || type === 'dblclick')) || (chkbox && type === 'checkbox');
        if (select) {
            this.selectRow(event, index, row);
        }
        else if (type === 'keydown') {
            if (event.key === Keys.return) {
                this.selectRow(event, index, row);
            }
            else if (event.key === 'a' &&
                (event.ctrlKey || event.metaKey)) {
                this.selectRow(event, 0, row); // The row property is ignored in this case. So we can pass anything.
            }
            else {
                this.onKeyboardFocus(model);
            }
        }
        this.activate.emit(model);
    }
    onKeyboardFocus(model) {
        const { key } = model.event;
        const shouldFocus = key === Keys.up || key === Keys.down || key === Keys.right || key === Keys.left;
        if (shouldFocus) {
            const isCellSelection = this.selectionType === SelectionType.cell;
            if (typeof this.disableRowCheck === 'function') {
                const isRowDisabled = this.disableRowCheck(model.row);
                if (isRowDisabled) {
                    return;
                }
            }
            if (!model.cellElement || !isCellSelection) {
                this.focusRow(model.rowElement, key);
            }
            else if (isCellSelection && model.cellIndex !== undefined) {
                this.focusCell(model.cellElement, model.rowElement, key, model.cellIndex);
            }
        }
    }
    focusRow(rowElement, key) {
        const nextRowElement = this.getPrevNextRow(rowElement, key);
        if (nextRowElement) {
            nextRowElement.focus();
        }
    }
    getPrevNextRow(rowElement, key) {
        const parentElement = rowElement.parentElement;
        if (parentElement) {
            let focusElement = null;
            if (key === Keys.up) {
                focusElement = parentElement.previousElementSibling;
            }
            else if (key === Keys.down) {
                focusElement = parentElement.nextElementSibling;
            }
            if (focusElement && focusElement.children.length) {
                return focusElement.children[0];
            }
        }
    }
    focusCell(cellElement, rowElement, key, cellIndex) {
        let nextCellElement = null;
        if (key === Keys.left) {
            nextCellElement = cellElement.previousElementSibling;
        }
        else if (key === Keys.right) {
            nextCellElement = cellElement.nextElementSibling;
        }
        else if (key === Keys.up || key === Keys.down) {
            const nextRowElement = this.getPrevNextRow(rowElement, key);
            if (nextRowElement) {
                const children = nextRowElement.getElementsByClassName('datatable-body-cell');
                if (children.length) {
                    nextCellElement = children[cellIndex];
                }
            }
        }
        if (nextCellElement &&
            'focus' in nextCellElement &&
            typeof nextCellElement.focus === 'function') {
            nextCellElement.focus();
        }
    }
    getRowSelected(row) {
        return this.getRowSelectedIdx(row, this.selected) > -1;
    }
    getRowSelectedIdx(row, selected) {
        if (!selected || !selected.length) {
            return -1;
        }
        const rowId = this.rowIdentity(row);
        return selected.findIndex(r => {
            const id = this.rowIdentity(r);
            return id === rowId;
        });
    }
    isGroup(row) {
        return !!this.groupedRows;
    }
    isRow(row) {
        return !this.groupedRows;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableBodyComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "20.0.5", type: DataTableBodyComponent, isStandalone: true, selector: "datatable-body", inputs: { rowDefTemplate: "rowDefTemplate", scrollbarV: "scrollbarV", scrollbarH: "scrollbarH", loadingIndicator: "loadingIndicator", ghostLoadingIndicator: "ghostLoadingIndicator", externalPaging: "externalPaging", rowHeight: "rowHeight", offsetX: "offsetX", selectionType: "selectionType", selected: "selected", rowIdentity: "rowIdentity", rowDetail: "rowDetail", groupHeader: "groupHeader", selectCheck: "selectCheck", displayCheck: "displayCheck", trackByProp: "trackByProp", rowClass: "rowClass", groupedRows: "groupedRows", groupExpansionDefault: "groupExpansionDefault", innerWidth: "innerWidth", groupRowsBy: "groupRowsBy", virtualization: "virtualization", summaryRow: "summaryRow", summaryPosition: "summaryPosition", summaryHeight: "summaryHeight", rowDraggable: "rowDraggable", rowDragEvents: "rowDragEvents", disableRowCheck: "disableRowCheck", pageSize: "pageSize", rows: "rows", columns: "columns", offset: "offset", rowCount: "rowCount", bodyHeight: "bodyHeight", verticalScrollVisible: "verticalScrollVisible" }, outputs: { scroll: "scroll", page: "page", activate: "activate", select: "select", rowContextmenu: "rowContextmenu", treeAction: "treeAction" }, host: { properties: { "style.width": "this.bodyWidth", "style.height": "this.bodyHeight" }, classAttribute: "datatable-body" }, viewQueries: [{ propertyName: "scroller", first: true, predicate: ScrollerComponent, descendants: true }], ngImport: i0, template: `
    @if (loadingIndicator) {
      <div class="custom-loading-indicator-wrapper">
        <div class="custom-loading-content">
          <ng-content select="[loading-indicator]"></ng-content>
        </div>
      </div>
    }
    @if (ghostLoadingIndicator && (!rowCount || !virtualization || !scrollbarV)) {
      <ghost-loader
        class="ghost-overlay"
        [columns]="columns"
        [pageSize]="pageSize"
        [rowHeight]="rowHeight"
        [ghostBodyHeight]="bodyHeight"
      >
      </ghost-loader>
    }
    @if (rows.length) {
      <datatable-scroller
        [scrollbarV]="scrollbarV"
        [scrollbarH]="scrollbarH"
        [scrollHeight]="scrollHeight()"
        [scrollWidth]="columnGroupWidths?.total"
        (scroll)="onBodyScroll($event)"
      >
        @if (summaryRow && summaryPosition === 'top') {
          <datatable-summary-row
            [rowHeight]="summaryHeight"
            [innerWidth]="innerWidth"
            [rows]="rows"
            [columns]="columns"
          >
          </datatable-summary-row>
        }
        <ng-template
          ngx-datatable-body-row
          #bodyRow
          let-row="row"
          let-index="index"
          let-indexInGroup="indexInGroup"
          let-groupedRows="groupedRows"
          let-disabled="disabled"
        >
          <datatable-body-row
            role="row"
            tabindex="-1"
            #rowElement
            [disabled]="disabled"
            [isSelected]="getRowSelected(row)"
            [innerWidth]="innerWidth"
            [columns]="columns"
            [rowHeight]="getRowHeight(row)"
            [row]="row"
            [group]="groupedRows"
            [rowIndex]="{ index: index, indexInGroup: indexInGroup }"
            [expanded]="getRowExpanded(row)"
            [rowClass]="rowClass"
            [displayCheck]="displayCheck"
            [treeStatus]="row?.treeStatus"
            [draggable]="rowDraggable"
            [verticalScrollVisible]="verticalScrollVisible"
            (treeAction)="onTreeAction(row)"
            (activate)="onActivate($event, index)"
            (drop)="drop($event, row, rowElement)"
            (dragover)="dragOver($event, row)"
            (dragenter)="dragEnter($event, row, rowElement)"
            (dragleave)="dragLeave($event, row, rowElement)"
            (dragstart)="drag($event, row, rowElement)"
            (dragend)="dragEnd($event, row)"
          >
          </datatable-body-row>
        </ng-template>

        <div [style.transform]="renderOffset()">
          @for (group of rowsToRender(); track rowTrackingFn(i, group); let i = $index) {
            @if (!group && ghostLoadingIndicator) {
              <ghost-loader cellMode [columns]="columns" [pageSize]="1" [rowHeight]="rowHeight" />
            } @else if (group) {
              @let disabled = isRow(group) && disableRowCheck && disableRowCheck(group);
              <!-- $any(group) is needed as the typing is broken and the feature as well. See #147. -->
              <!-- FIXME: This has to be revisited and fixed. -->
              <datatable-row-wrapper
                [attr.hidden]="
                  ghostLoadingIndicator && (!rowCount || !virtualization || !scrollbarV)
                    ? true
                    : null
                "
                [groupedRows]="groupedRows"
                [innerWidth]="innerWidth"
                [style.width]="groupedRows ? columnGroupWidths.total : undefined"
                [rowDetail]="rowDetail"
                [groupHeader]="groupHeader"
                [offsetX]="offsetX"
                [detailRowHeight]="getDetailRowHeight(group && $any(group)[i], i)"
                [groupHeaderRowHeight]="getGroupHeaderRowHeight(group && $any(group)[i], i)"
                [row]="group"
                [disabled]="disabled"
                [expanded]="getRowExpanded(group)"
                [rowIndex]="indexes().first + i"
                [selected]="selected"
                (rowContextmenu)="rowContextmenu.emit($event)"
              >
                @if (rowDefTemplate) {
                  <ng-container
                    *rowDefInternal="
                      {
                        template: rowDefTemplate,
                        rowTemplate: bodyRow,
                        row: group,
                        index: i
                      };
                      disabled: disabled
                    "
                  />
                } @else {
                  @if (isRow(group)) {
                    <ng-container
                      [ngTemplateOutlet]="bodyRow"
                      [ngTemplateOutletContext]="{
                        row: group,
                        index: indexes().first + i,
                        disabled
                      }"
                    ></ng-container>
                  }
                }

                @if (isGroup(group)) {
                  <!-- The row typecast is due to angular compiler acting weird. It is obvious that it is of type TRow, but the compiler does not understand. -->
                  @for (row of group.value; track rowTrackingFn($index, row)) {
                    @let disabled = disableRowCheck && disableRowCheck(row);
                    <ng-container
                      [ngTemplateOutlet]="bodyRow"
                      [ngTemplateOutletContext]="{
                        row,
                        groupedRows: group?.value,
                        index: indexes().first + i,
                        indexInGroup: $index,
                        disabled
                      }"
                    ></ng-container>
                  }
                }
              </datatable-row-wrapper>
            }
          }
        </div>
      </datatable-scroller>
      @if (summaryRow && summaryPosition === 'bottom') {
        <datatable-summary-row
          role="row"
          [rowHeight]="summaryHeight"
          [innerWidth]="innerWidth"
          [rows]="rows"
          [columns]="columns"
        >
        </datatable-summary-row>
      }
    }
    @if (!rows?.length && !loadingIndicator && !ghostLoadingIndicator) {
      <datatable-scroller
        [scrollbarV]="scrollbarV"
        [scrollbarH]="scrollbarH"
        [scrollHeight]="scrollHeight()"
        [style.width]="scrollbarH ? columnGroupWidths?.total + 'px' : '100%'"
        (scroll)="onBodyScroll($event)"
      >
        <ng-content select="[empty-content]"></ng-content>
      </datatable-scroller>
    }
  `, isInline: true, styles: [":host{position:relative;z-index:10;display:block;overflow:hidden}:host-context(ngx-datatable.scroll-horz) :host{overflow-x:auto;-webkit-overflow-scrolling:touch}datatable-scroller{display:block}:host-context(ngx-datatable.fixed-row) datatable-scroller{white-space:nowrap}:host-context(ngx-datatable.scroll-vertical) :host{overflow-y:auto}[hidden]{display:none!important}\n"], dependencies: [{ kind: "component", type: DataTableGhostLoaderComponent, selector: "ghost-loader", inputs: ["columns", "pageSize", "rowHeight", "ghostBodyHeight", "cellMode"] }, { kind: "component", type: ScrollerComponent, selector: "datatable-scroller", inputs: ["scrollbarV", "scrollbarH", "scrollHeight", "scrollWidth"], outputs: ["scroll"] }, { kind: "component", type: DataTableSummaryRowComponent, selector: "datatable-summary-row", inputs: ["rows", "columns", "rowHeight", "innerWidth"] }, { kind: "component", type: DataTableRowWrapperComponent, selector: "datatable-row-wrapper", inputs: ["innerWidth", "rowDetail", "groupHeader", "offsetX", "detailRowHeight", "groupHeaderRowHeight", "row", "groupedRows", "selected", "disabled", "rowIndex", "expanded"], outputs: ["rowContextmenu"] }, { kind: "directive", type: DatatableRowDefInternalDirective, selector: "[rowDefInternal]", inputs: ["rowDefInternal", "rowDefInternalDisabled"] }, { kind: "component", type: DataTableBodyRowComponent, selector: "datatable-body-row", inputs: ["columns", "innerWidth", "expanded", "rowClass", "row", "group", "isSelected", "rowIndex", "displayCheck", "treeStatus", "verticalScrollVisible", "disabled", "rowHeight"], outputs: ["activate", "treeAction"] }, { kind: "directive", type: DraggableDirective, selector: "[draggable]", inputs: ["dragEventTarget", "dragModel", "dragX", "dragY"], outputs: ["dragStart", "dragging", "dragEnd"] }, { kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "directive", type: DatatableBodyRowDirective, selector: "[ngx-datatable-body-row]" }], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableBodyComponent, decorators: [{
            type: Component,
            args: [{ selector: 'datatable-body', template: `
    @if (loadingIndicator) {
      <div class="custom-loading-indicator-wrapper">
        <div class="custom-loading-content">
          <ng-content select="[loading-indicator]"></ng-content>
        </div>
      </div>
    }
    @if (ghostLoadingIndicator && (!rowCount || !virtualization || !scrollbarV)) {
      <ghost-loader
        class="ghost-overlay"
        [columns]="columns"
        [pageSize]="pageSize"
        [rowHeight]="rowHeight"
        [ghostBodyHeight]="bodyHeight"
      >
      </ghost-loader>
    }
    @if (rows.length) {
      <datatable-scroller
        [scrollbarV]="scrollbarV"
        [scrollbarH]="scrollbarH"
        [scrollHeight]="scrollHeight()"
        [scrollWidth]="columnGroupWidths?.total"
        (scroll)="onBodyScroll($event)"
      >
        @if (summaryRow && summaryPosition === 'top') {
          <datatable-summary-row
            [rowHeight]="summaryHeight"
            [innerWidth]="innerWidth"
            [rows]="rows"
            [columns]="columns"
          >
          </datatable-summary-row>
        }
        <ng-template
          ngx-datatable-body-row
          #bodyRow
          let-row="row"
          let-index="index"
          let-indexInGroup="indexInGroup"
          let-groupedRows="groupedRows"
          let-disabled="disabled"
        >
          <datatable-body-row
            role="row"
            tabindex="-1"
            #rowElement
            [disabled]="disabled"
            [isSelected]="getRowSelected(row)"
            [innerWidth]="innerWidth"
            [columns]="columns"
            [rowHeight]="getRowHeight(row)"
            [row]="row"
            [group]="groupedRows"
            [rowIndex]="{ index: index, indexInGroup: indexInGroup }"
            [expanded]="getRowExpanded(row)"
            [rowClass]="rowClass"
            [displayCheck]="displayCheck"
            [treeStatus]="row?.treeStatus"
            [draggable]="rowDraggable"
            [verticalScrollVisible]="verticalScrollVisible"
            (treeAction)="onTreeAction(row)"
            (activate)="onActivate($event, index)"
            (drop)="drop($event, row, rowElement)"
            (dragover)="dragOver($event, row)"
            (dragenter)="dragEnter($event, row, rowElement)"
            (dragleave)="dragLeave($event, row, rowElement)"
            (dragstart)="drag($event, row, rowElement)"
            (dragend)="dragEnd($event, row)"
          >
          </datatable-body-row>
        </ng-template>

        <div [style.transform]="renderOffset()">
          @for (group of rowsToRender(); track rowTrackingFn(i, group); let i = $index) {
            @if (!group && ghostLoadingIndicator) {
              <ghost-loader cellMode [columns]="columns" [pageSize]="1" [rowHeight]="rowHeight" />
            } @else if (group) {
              @let disabled = isRow(group) && disableRowCheck && disableRowCheck(group);
              <!-- $any(group) is needed as the typing is broken and the feature as well. See #147. -->
              <!-- FIXME: This has to be revisited and fixed. -->
              <datatable-row-wrapper
                [attr.hidden]="
                  ghostLoadingIndicator && (!rowCount || !virtualization || !scrollbarV)
                    ? true
                    : null
                "
                [groupedRows]="groupedRows"
                [innerWidth]="innerWidth"
                [style.width]="groupedRows ? columnGroupWidths.total : undefined"
                [rowDetail]="rowDetail"
                [groupHeader]="groupHeader"
                [offsetX]="offsetX"
                [detailRowHeight]="getDetailRowHeight(group && $any(group)[i], i)"
                [groupHeaderRowHeight]="getGroupHeaderRowHeight(group && $any(group)[i], i)"
                [row]="group"
                [disabled]="disabled"
                [expanded]="getRowExpanded(group)"
                [rowIndex]="indexes().first + i"
                [selected]="selected"
                (rowContextmenu)="rowContextmenu.emit($event)"
              >
                @if (rowDefTemplate) {
                  <ng-container
                    *rowDefInternal="
                      {
                        template: rowDefTemplate,
                        rowTemplate: bodyRow,
                        row: group,
                        index: i
                      };
                      disabled: disabled
                    "
                  />
                } @else {
                  @if (isRow(group)) {
                    <ng-container
                      [ngTemplateOutlet]="bodyRow"
                      [ngTemplateOutletContext]="{
                        row: group,
                        index: indexes().first + i,
                        disabled
                      }"
                    ></ng-container>
                  }
                }

                @if (isGroup(group)) {
                  <!-- The row typecast is due to angular compiler acting weird. It is obvious that it is of type TRow, but the compiler does not understand. -->
                  @for (row of group.value; track rowTrackingFn($index, row)) {
                    @let disabled = disableRowCheck && disableRowCheck(row);
                    <ng-container
                      [ngTemplateOutlet]="bodyRow"
                      [ngTemplateOutletContext]="{
                        row,
                        groupedRows: group?.value,
                        index: indexes().first + i,
                        indexInGroup: $index,
                        disabled
                      }"
                    ></ng-container>
                  }
                }
              </datatable-row-wrapper>
            }
          }
        </div>
      </datatable-scroller>
      @if (summaryRow && summaryPosition === 'bottom') {
        <datatable-summary-row
          role="row"
          [rowHeight]="summaryHeight"
          [innerWidth]="innerWidth"
          [rows]="rows"
          [columns]="columns"
        >
        </datatable-summary-row>
      }
    }
    @if (!rows?.length && !loadingIndicator && !ghostLoadingIndicator) {
      <datatable-scroller
        [scrollbarV]="scrollbarV"
        [scrollbarH]="scrollbarH"
        [scrollHeight]="scrollHeight()"
        [style.width]="scrollbarH ? columnGroupWidths?.total + 'px' : '100%'"
        (scroll)="onBodyScroll($event)"
      >
        <ng-content select="[empty-content]"></ng-content>
      </datatable-scroller>
    }
  `, changeDetection: ChangeDetectionStrategy.OnPush, host: {
                        class: 'datatable-body'
                    }, imports: [
                        DataTableGhostLoaderComponent,
                        ScrollerComponent,
                        DataTableSummaryRowComponent,
                        DataTableRowWrapperComponent,
                        DatatableRowDefInternalDirective,
                        DataTableBodyRowComponent,
                        DraggableDirective,
                        NgTemplateOutlet,
                        DatatableBodyRowDirective
                    ], styles: [":host{position:relative;z-index:10;display:block;overflow:hidden}:host-context(ngx-datatable.scroll-horz) :host{overflow-x:auto;-webkit-overflow-scrolling:touch}datatable-scroller{display:block}:host-context(ngx-datatable.fixed-row) datatable-scroller{white-space:nowrap}:host-context(ngx-datatable.scroll-vertical) :host{overflow-y:auto}[hidden]{display:none!important}\n"] }]
        }], ctorParameters: () => [], propDecorators: { rowDefTemplate: [{
                type: Input
            }], scrollbarV: [{
                type: Input
            }], scrollbarH: [{
                type: Input
            }], loadingIndicator: [{
                type: Input
            }], ghostLoadingIndicator: [{
                type: Input
            }], externalPaging: [{
                type: Input
            }], rowHeight: [{
                type: Input
            }], offsetX: [{
                type: Input
            }], selectionType: [{
                type: Input
            }], selected: [{
                type: Input
            }], rowIdentity: [{
                type: Input
            }], rowDetail: [{
                type: Input
            }], groupHeader: [{
                type: Input
            }], selectCheck: [{
                type: Input
            }], displayCheck: [{
                type: Input
            }], trackByProp: [{
                type: Input
            }], rowClass: [{
                type: Input
            }], groupedRows: [{
                type: Input
            }], groupExpansionDefault: [{
                type: Input
            }], innerWidth: [{
                type: Input
            }], groupRowsBy: [{
                type: Input
            }], virtualization: [{
                type: Input
            }], summaryRow: [{
                type: Input
            }], summaryPosition: [{
                type: Input
            }], summaryHeight: [{
                type: Input
            }], rowDraggable: [{
                type: Input
            }], rowDragEvents: [{
                type: Input
            }], disableRowCheck: [{
                type: Input
            }], pageSize: [{
                type: Input
            }], rows: [{
                type: Input
            }], columns: [{
                type: Input
            }], offset: [{
                type: Input
            }], rowCount: [{
                type: Input
            }], bodyWidth: [{
                type: HostBinding,
                args: ['style.width']
            }], bodyHeight: [{
                type: Input
            }, {
                type: HostBinding,
                args: ['style.height']
            }], verticalScrollVisible: [{
                type: Input
            }], scroll: [{
                type: Output
            }], page: [{
                type: Output
            }], activate: [{
                type: Output
            }], select: [{
                type: Output
            }], rowContextmenu: [{
                type: Output
            }], treeAction: [{
                type: Output
            }], scroller: [{
                type: ViewChild,
                args: [ScrollerComponent]
            }] } });

/**
 * Gets the width of the scrollbar.  Nesc for windows
 * http://stackoverflow.com/a/13382873/888165
 */
class ScrollbarHelper {
    constructor() {
        this.document = inject(DOCUMENT);
        this.width = this.getWidth();
    }
    getWidth() {
        const outer = this.document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.width = '100px';
        this.document.body.appendChild(outer);
        const widthNoScroll = outer.offsetWidth;
        outer.style.overflow = 'scroll';
        const inner = this.document.createElement('div');
        inner.style.width = '100%';
        outer.appendChild(inner);
        const widthWithScroll = inner.offsetWidth;
        this.document.body.removeChild(outer);
        return widthNoScroll - widthWithScroll;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: ScrollbarHelper, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: ScrollbarHelper, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: ScrollbarHelper, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });

class LongPressDirective {
    constructor() {
        this.pressEnabled = true;
        this.duration = 500;
        this.longPressStart = new EventEmitter();
        this.longPressEnd = new EventEmitter();
        this.pressing = signal(false);
        this.isLongPressing = signal(false);
    }
    onMouseDown(event) {
        const isMouse = event instanceof MouseEvent;
        // don't do right/middle clicks
        if (!this.pressEnabled || (isMouse && event.button !== 0)) {
            return;
        }
        // don't start drag if its on resize handle
        const target = event.target;
        if (target.classList.contains('resize-handle')) {
            return;
        }
        this.pressing.set(true);
        this.isLongPressing.set(false);
        const mouseup = fromEvent(document, isMouse ? 'mouseup' : 'touchend');
        this.subscription = mouseup.subscribe(() => this.endPress());
        this.timeout = setTimeout(() => {
            this.isLongPressing.set(true);
            this.longPressStart.emit({
                event,
                model: this.pressModel
            });
        }, this.duration);
    }
    endPress() {
        clearTimeout(this.timeout);
        this.isLongPressing.set(false);
        this.pressing.set(false);
        this._destroySubscription();
        this.longPressEnd.emit({
            model: this.pressModel
        });
    }
    ngOnDestroy() {
        clearTimeout(this.timeout);
        this._destroySubscription();
    }
    _destroySubscription() {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = undefined;
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: LongPressDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "20.0.5", type: LongPressDirective, isStandalone: true, selector: "[long-press]", inputs: { pressEnabled: ["pressEnabled", "pressEnabled", booleanAttribute], pressModel: "pressModel", duration: ["duration", "duration", numberAttribute] }, outputs: { longPressStart: "longPressStart", longPressEnd: "longPressEnd" }, host: { listeners: { "touchstart": "onMouseDown($event)", "mousedown": "onMouseDown($event)" }, properties: { "class.press": "pressing()", "class.longpress": "isLongPressing()" } }, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: LongPressDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[long-press]',
                    host: {
                        '(touchstart)': 'onMouseDown($event)',
                        '(mousedown)': 'onMouseDown($event)',
                        '[class.press]': 'pressing()',
                        '[class.longpress]': 'isLongPressing()'
                    }
                }]
        }], propDecorators: { pressEnabled: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], pressModel: [{
                type: Input
            }], duration: [{
                type: Input,
                args: [{ transform: numberAttribute }]
            }], longPressStart: [{
                type: Output
            }], longPressEnd: [{
                type: Output
            }] } });

/**
 * Gets the next sort direction
 */
function nextSortDir(sortType, current) {
    if (sortType === SortType.single) {
        if (current === SortDirection.asc) {
            return SortDirection.desc;
        }
        else {
            return SortDirection.asc;
        }
    }
    else {
        if (!current) {
            return SortDirection.asc;
        }
        else if (current === SortDirection.asc) {
            return SortDirection.desc;
        }
        else if (current === SortDirection.desc) {
            return undefined;
        }
        // avoid TS7030: Not all code paths return a value.
        return undefined;
    }
}
/**
 * Adapted from fueld-ui on 6/216
 * https://github.com/FuelInteractive/fuel-ui/tree/master/src/pipes/OrderBy
 */
function orderByComparator(a, b) {
    if (a === null || typeof a === 'undefined') {
        a = 0;
    }
    if (b === null || typeof b === 'undefined') {
        b = 0;
    }
    if (a instanceof Date && b instanceof Date) {
        if (a < b) {
            return -1;
        }
        if (a > b) {
            return 1;
        }
    }
    else if (isNaN(parseFloat(a)) || !isFinite(a) || isNaN(parseFloat(b)) || !isFinite(b)) {
        // Convert to string in case of a=0 or b=0
        a = String(a);
        b = String(b);
        // Isn't a number so lowercase the string to properly compare
        if (a.toLowerCase() < b.toLowerCase()) {
            return -1;
        }
        if (a.toLowerCase() > b.toLowerCase()) {
            return 1;
        }
    }
    else {
        // Parse strings as numbers to compare properly
        if (parseFloat(a) < parseFloat(b)) {
            return -1;
        }
        if (parseFloat(a) > parseFloat(b)) {
            return 1;
        }
    }
    // equal each other
    return 0;
}
/**
 * creates a shallow copy of the `rows` input and returns the sorted copy. this function
 * does not sort the `rows` argument in place
 */
function sortRows(rows, columns, dirs) {
    if (!rows) {
        return [];
    }
    if (!dirs || !dirs.length || !columns) {
        return [...rows];
    }
    const temp = [...rows];
    const cols = columns.reduce((obj, col) => {
        if (col.sortable) {
            obj[col.prop] = col.comparator;
        }
        return obj;
    }, {});
    // cache valueGetter and compareFn so that they
    // do not need to be looked-up in the sort function body
    const cachedDirs = dirs.map(dir => {
        const prop = dir.prop;
        return {
            prop,
            dir: dir.dir,
            valueGetter: getterForProp(prop),
            compareFn: cols[prop]
        };
    });
    return temp.sort((rowA, rowB) => {
        for (const cachedDir of cachedDirs) {
            // Get property and valuegetters for column to be sorted
            const { prop, valueGetter } = cachedDir;
            // Get A and B cell values from rows based on properties of the columns
            const propA = valueGetter(rowA, prop);
            const propB = valueGetter(rowB, prop);
            // Compare function gets five parameters:
            // Two cell values to be compared as propA and propB
            // Two rows corresponding to the cells as rowA and rowB
            // Direction of the sort for this column as SortDirection
            // Compare can be a standard JS comparison function (a,b) => -1|0|1
            // as additional parameters are silently ignored. The whole row and sort
            // direction enable more complex sort logic.
            const comparison = cachedDir.dir !== SortDirection.desc
                ? cachedDir.compareFn(propA, propB, rowA, rowB, cachedDir.dir)
                : -cachedDir.compareFn(propA, propB, rowA, rowB, cachedDir.dir);
            // Don't return 0 yet in case of needing to sort by next property
            if (comparison !== 0) {
                return comparison;
            }
        }
        return 0;
    });
}
function sortGroupedRows(groupedRows, columns, dirs, sortOnGroupHeader) {
    if (sortOnGroupHeader) {
        groupedRows = sortRows(groupedRows, columns, [
            {
                dir: sortOnGroupHeader.dir,
                prop: 'key'
            }
        ]);
    }
    return groupedRows.map(group => ({ ...group, value: sortRows(group.value, columns, dirs) }));
}

class DataTableHeaderCellComponent {
    set allRowsSelected(value) {
        this._allRowsSelected = value;
        this.cellContext.allRowsSelected = value;
    }
    get allRowsSelected() {
        return this._allRowsSelected;
    }
    set column(column) {
        this._column = column;
        this.cellContext.column = column;
        this.cd.markForCheck();
    }
    get column() {
        return this._column;
    }
    set sorts(val) {
        this._sorts = val;
        this.sortDir = this.calcSortDir(val);
        this.cellContext.sortDir = this.sortDir;
        this.sortClass = this.calcSortClass(this.sortDir);
        this.cd.markForCheck();
    }
    get sorts() {
        return this._sorts;
    }
    get columnCssClasses() {
        let cls = 'datatable-header-cell';
        if (this.column.sortable) {
            cls += ' sortable';
        }
        if (this.column.resizeable) {
            cls += ' resizeable';
        }
        if (this.column.headerClass) {
            if (typeof this.column.headerClass === 'string') {
                cls += ' ' + this.column.headerClass;
            }
            else if (typeof this.column.headerClass === 'function') {
                const res = this.column.headerClass({
                    column: this.column
                });
                if (typeof res === 'string') {
                    cls += ' ' + res;
                }
                else if (typeof res === 'object') {
                    const keys = Object.keys(res);
                    for (const k of keys) {
                        if (res[k] === true) {
                            cls += ` ${k}`;
                        }
                    }
                }
            }
        }
        const sortDir = this.sortDir;
        if (sortDir) {
            cls += ` sort-active sort-${sortDir}`;
        }
        return cls;
    }
    get name() {
        // guaranteed to have a value by setColumnDefaults() in column-helper.ts
        return this.column.headerTemplate === undefined ? this.column.name : undefined;
    }
    get minWidth() {
        return this.column.minWidth;
    }
    get maxWidth() {
        return this.column.maxWidth;
    }
    get width() {
        return this.column.width;
    }
    get tabindex() {
        return this.column.sortable ? 0 : -1;
    }
    get isCheckboxable() {
        return this.column.headerCheckboxable;
    }
    constructor() {
        this.cd = inject(ChangeDetectorRef);
        this.enableClearingSortState = false;
        this.sort = new EventEmitter();
        this.select = new EventEmitter();
        this.columnContextmenu = new EventEmitter(false);
        this.resize = new EventEmitter();
        this.resizing = new EventEmitter();
        this.element = inject(ElementRef).nativeElement;
        // Counter to reset sort once user sort asc and desc.
        this.totalSortStatesApplied = 0;
        this.cellContext = {
            column: this.column,
            sortDir: this.sortDir,
            sortFn: () => this.onSort(),
            allRowsSelected: this.allRowsSelected,
            selectFn: () => this.select.emit()
        };
    }
    onContextmenu($event) {
        this.columnContextmenu.emit({ event: $event, column: this.column });
        if (this.column.draggable) {
            $event.preventDefault();
        }
    }
    enter() {
        this.onSort();
    }
    ngOnInit() {
        this.sortClass = this.calcSortClass(this.sortDir);
        // If there is already a default sort then start the counter with 1.
        if (this.sortDir) {
            this.totalSortStatesApplied = 1;
        }
    }
    ngOnDestroy() {
        this.destroySubscription();
    }
    calcSortDir(sorts) {
        if (sorts && this.column) {
            const sort = sorts.find((s) => {
                return s.prop === this.column.prop;
            });
            if (sort) {
                return sort.dir;
            }
        }
    }
    onSort() {
        if (!this.column.sortable) {
            return;
        }
        this.totalSortStatesApplied++;
        let newValue = nextSortDir(this.sortType, this.sortDir);
        // User has done both direction sort so we reset the next sort.
        if (this.enableClearingSortState && this.totalSortStatesApplied === 3) {
            newValue = undefined;
            this.totalSortStatesApplied = 0;
        }
        this.sort.emit({
            column: this.column,
            prevValue: this.sortDir,
            newValue
        });
    }
    calcSortClass(sortDir) {
        if (!this.cellContext.column.sortable) {
            return undefined;
        }
        if (sortDir === SortDirection.asc) {
            return `sort-btn sort-asc ${this.sortAscendingIcon ?? 'datatable-icon-up'}`;
        }
        else if (sortDir === SortDirection.desc) {
            return `sort-btn sort-desc ${this.sortDescendingIcon ?? 'datatable-icon-down'}`;
        }
        else {
            return `sort-btn ${this.sortUnsetIcon ?? 'datatable-icon-sort-unset'}`;
        }
    }
    onMousedown(event) {
        const isMouse = event instanceof MouseEvent;
        const initialWidth = this.element.clientWidth;
        const { screenX } = getPositionFromEvent(event);
        event.stopPropagation();
        const mouseup = fromEvent(document, isMouse ? 'mouseup' : 'touchend');
        this.subscription = mouseup.subscribe(() => this.onMouseup());
        const mouseMoveSub = fromEvent(document, isMouse ? 'mousemove' : 'touchmove')
            .pipe(takeUntil$1(mouseup))
            .subscribe((e) => this.move(e, initialWidth, screenX));
        this.subscription.add(mouseMoveSub);
    }
    onMouseup() {
        if (this.subscription && !this.subscription.closed) {
            this.destroySubscription();
            this.resize.emit({ width: this.element.clientWidth, column: this.column });
        }
    }
    move(event, initialWidth, mouseDownScreenX) {
        const movementX = getPositionFromEvent(event).screenX - mouseDownScreenX;
        const newWidth = initialWidth + movementX;
        this.resizing.emit({ width: newWidth, column: this.column });
    }
    destroySubscription() {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = undefined;
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableHeaderCellComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "20.0.5", type: DataTableHeaderCellComponent, isStandalone: true, selector: "datatable-header-cell", inputs: { sortType: "sortType", sortAscendingIcon: "sortAscendingIcon", sortDescendingIcon: "sortDescendingIcon", sortUnsetIcon: "sortUnsetIcon", isTarget: "isTarget", targetMarkerTemplate: "targetMarkerTemplate", targetMarkerContext: "targetMarkerContext", enableClearingSortState: "enableClearingSortState", allRowsSelected: "allRowsSelected", selectionType: "selectionType", column: "column", headerHeight: "headerHeight", sorts: "sorts" }, outputs: { sort: "sort", select: "select", columnContextmenu: "columnContextmenu", resize: "resize", resizing: "resizing" }, host: { listeners: { "contextmenu": "onContextmenu($event)", "keydown.enter": "enter()" }, properties: { "attr.resizeable": "column.resizeable", "style.height.px": "this.headerHeight", "class": "this.columnCssClasses", "attr.title": "this.name", "style.minWidth.px": "this.minWidth", "style.maxWidth.px": "this.maxWidth", "style.width.px": "this.width", "tabindex": "this.tabindex" }, classAttribute: "datatable-header-cell" }, ngImport: i0, template: `
    <div class="datatable-header-cell-template-wrap">
      @if (isTarget) {
      <ng-template
        [ngTemplateOutlet]="targetMarkerTemplate!"
        [ngTemplateOutletContext]="targetMarkerContext"
      >
      </ng-template>
      } @if (isCheckboxable) {
      <label class="datatable-checkbox">
        <input type="checkbox" [checked]="allRowsSelected" (change)="select.emit()" />
      </label>
      } @if (column.headerTemplate) {
      <ng-template
        [ngTemplateOutlet]="column.headerTemplate"
        [ngTemplateOutletContext]="cellContext"
      >
      </ng-template>
      } @else {
      <span class="datatable-header-cell-wrapper">
        <span class="datatable-header-cell-label draggable" (click)="onSort()">
          {{ name }}
        </span>
      </span>
      }
      <span (click)="onSort()" [class]="sortClass"> </span>
    </div>
    @if (column.resizeable) {
    <span
      class="resize-handle"
      (mousedown)="onMousedown($event)"
      (touchstart)="onMousedown($event)"
    ></span>
    }
  `, isInline: true, styles: [":host{overflow-x:hidden;vertical-align:top;line-height:1.625;position:relative;display:inline-block}:host:focus{outline:none}:host-context(ngx-datatable.fixed-header) :host{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}:host.sortable .datatable-header-cell-wrapper{cursor:pointer}:host.longpress .datatable-header-cell-wrapper{cursor:move}.datatable-header-cell-template-wrap{height:inherit}.sort-btn{line-height:100%;vertical-align:middle;display:inline-block;cursor:pointer}.resize-handle,.resize-handle--not-resizable{display:inline-block;position:absolute;right:0;top:0;bottom:0;width:5px;padding:0 4px;visibility:hidden}.resize-handle{cursor:ew-resize}:host(.resizeable:hover) .resize-handle{visibility:visible}@media (hover: none){:host{touch-action:none}:host .resize-handle{visibility:visible}:host .datatable-header-cell-label.draggable{-webkit-user-select:none;user-select:none}}.resize-handle--not-resizable :host(:hover){visibility:visible}:host::ng-deep .targetMarker{position:absolute;top:0;bottom:0}:host::ng-deep .targetMarker.dragFromLeft{right:0}:host::ng-deep .targetMarker.dragFromRight{left:0}\n"], dependencies: [{ kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableHeaderCellComponent, decorators: [{
            type: Component,
            args: [{ selector: 'datatable-header-cell', template: `
    <div class="datatable-header-cell-template-wrap">
      @if (isTarget) {
      <ng-template
        [ngTemplateOutlet]="targetMarkerTemplate!"
        [ngTemplateOutletContext]="targetMarkerContext"
      >
      </ng-template>
      } @if (isCheckboxable) {
      <label class="datatable-checkbox">
        <input type="checkbox" [checked]="allRowsSelected" (change)="select.emit()" />
      </label>
      } @if (column.headerTemplate) {
      <ng-template
        [ngTemplateOutlet]="column.headerTemplate"
        [ngTemplateOutletContext]="cellContext"
      >
      </ng-template>
      } @else {
      <span class="datatable-header-cell-wrapper">
        <span class="datatable-header-cell-label draggable" (click)="onSort()">
          {{ name }}
        </span>
      </span>
      }
      <span (click)="onSort()" [class]="sortClass"> </span>
    </div>
    @if (column.resizeable) {
    <span
      class="resize-handle"
      (mousedown)="onMousedown($event)"
      (touchstart)="onMousedown($event)"
    ></span>
    }
  `, host: {
                        'class': 'datatable-header-cell',
                        '[attr.resizeable]': 'column.resizeable'
                    }, changeDetection: ChangeDetectionStrategy.OnPush, imports: [NgTemplateOutlet], styles: [":host{overflow-x:hidden;vertical-align:top;line-height:1.625;position:relative;display:inline-block}:host:focus{outline:none}:host-context(ngx-datatable.fixed-header) :host{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}:host.sortable .datatable-header-cell-wrapper{cursor:pointer}:host.longpress .datatable-header-cell-wrapper{cursor:move}.datatable-header-cell-template-wrap{height:inherit}.sort-btn{line-height:100%;vertical-align:middle;display:inline-block;cursor:pointer}.resize-handle,.resize-handle--not-resizable{display:inline-block;position:absolute;right:0;top:0;bottom:0;width:5px;padding:0 4px;visibility:hidden}.resize-handle{cursor:ew-resize}:host(.resizeable:hover) .resize-handle{visibility:visible}@media (hover: none){:host{touch-action:none}:host .resize-handle{visibility:visible}:host .datatable-header-cell-label.draggable{-webkit-user-select:none;user-select:none}}.resize-handle--not-resizable :host(:hover){visibility:visible}:host::ng-deep .targetMarker{position:absolute;top:0;bottom:0}:host::ng-deep .targetMarker.dragFromLeft{right:0}:host::ng-deep .targetMarker.dragFromRight{left:0}\n"] }]
        }], ctorParameters: () => [], propDecorators: { sortType: [{
                type: Input
            }], sortAscendingIcon: [{
                type: Input
            }], sortDescendingIcon: [{
                type: Input
            }], sortUnsetIcon: [{
                type: Input
            }], isTarget: [{
                type: Input
            }], targetMarkerTemplate: [{
                type: Input
            }], targetMarkerContext: [{
                type: Input
            }], enableClearingSortState: [{
                type: Input
            }], allRowsSelected: [{
                type: Input
            }], selectionType: [{
                type: Input
            }], column: [{
                type: Input
            }], headerHeight: [{
                type: HostBinding,
                args: ['style.height.px']
            }, {
                type: Input
            }], sorts: [{
                type: Input
            }], sort: [{
                type: Output
            }], select: [{
                type: Output
            }], columnContextmenu: [{
                type: Output
            }], resize: [{
                type: Output
            }], resizing: [{
                type: Output
            }], columnCssClasses: [{
                type: HostBinding,
                args: ['class']
            }], name: [{
                type: HostBinding,
                args: ['attr.title']
            }], minWidth: [{
                type: HostBinding,
                args: ['style.minWidth.px']
            }], maxWidth: [{
                type: HostBinding,
                args: ['style.maxWidth.px']
            }], width: [{
                type: HostBinding,
                args: ['style.width.px']
            }], tabindex: [{
                type: HostBinding,
                args: ['tabindex']
            }], onContextmenu: [{
                type: HostListener,
                args: ['contextmenu', ['$event']]
            }], enter: [{
                type: HostListener,
                args: ['keydown.enter']
            }] } });

class OrderableDirective {
    constructor() {
        this.document = inject(DOCUMENT);
        this.reorder = new EventEmitter();
        this.targetChanged = new EventEmitter();
        this.differ = inject(KeyValueDiffers).find({}).create();
    }
    ngAfterContentInit() {
        // HACK: Investigate Better Way
        this.updateSubscriptions();
        this.draggables.changes.subscribe(this.updateSubscriptions.bind(this));
    }
    ngOnDestroy() {
        this.draggables.forEach(d => {
            d.dragStart.unsubscribe();
            d.dragging.unsubscribe();
            d.dragEnd.unsubscribe();
        });
    }
    updateSubscriptions() {
        const diffs = this.differ.diff(this.createMapDiffs());
        if (diffs) {
            const subscribe = (record) => {
                unsubscribe(record);
                const { currentValue } = record;
                if (currentValue) {
                    currentValue.dragStart.subscribe(this.onDragStart.bind(this));
                    currentValue.dragging.subscribe(this.onDragging.bind(this));
                    currentValue.dragEnd.subscribe(this.onDragEnd.bind(this));
                }
            };
            const unsubscribe = ({ previousValue }) => {
                if (previousValue) {
                    previousValue.dragStart.unsubscribe();
                    previousValue.dragging.unsubscribe();
                    previousValue.dragEnd.unsubscribe();
                }
            };
            diffs.forEachAddedItem(subscribe);
            // diffs.forEachChangedItem(subscribe.bind(this));
            diffs.forEachRemovedItem(unsubscribe);
        }
    }
    onDragStart() {
        this.positions = {};
        let i = 0;
        for (const dragger of this.draggables.toArray()) {
            const elm = dragger.element;
            const left = parseInt(elm.offsetLeft.toString(), 0);
            this.positions[dragger.dragModel.$$id] = {
                left,
                right: left + parseInt(elm.offsetWidth.toString(), 0),
                index: i++,
                element: elm
            };
        }
    }
    onDragging({ element, model, event }) {
        const prevPos = this.positions[model.$$id];
        const target = this.isTarget(model, event);
        if (target) {
            if (this.lastDraggingIndex !== target.i) {
                this.targetChanged.emit({
                    prevIndex: this.lastDraggingIndex,
                    newIndex: target.i,
                    initialIndex: prevPos.index
                });
                this.lastDraggingIndex = target.i;
            }
        }
        else if (this.lastDraggingIndex !== prevPos.index) {
            this.targetChanged.emit({
                prevIndex: this.lastDraggingIndex,
                initialIndex: prevPos.index
            });
            this.lastDraggingIndex = prevPos.index;
        }
    }
    onDragEnd({ element, model, event }) {
        const prevPos = this.positions[model.$$id];
        const target = this.isTarget(model, event);
        if (target) {
            this.reorder.emit({
                prevValue: prevPos.index,
                newValue: target.i,
                column: model
            });
        }
        this.lastDraggingIndex = undefined;
        element.style.left = 'auto';
    }
    isTarget(model, event) {
        let i = 0;
        const { clientX, clientY } = getPositionFromEvent(event);
        const targets = this.document.elementsFromPoint(clientX, clientY);
        for (const id in this.positions) {
            // current column position which throws event.
            const pos = this.positions[id];
            // since we drag the inner span, we need to find it in the elements at the cursor
            if (model.$$id !== id && targets.find((el) => el === pos.element)) {
                return {
                    pos,
                    i
                };
            }
            i++;
        }
    }
    createMapDiffs() {
        return this.draggables.toArray().reduce((acc, curr) => {
            acc[curr.dragModel.$$id] = curr;
            return acc;
        }, {});
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: OrderableDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "20.0.5", type: OrderableDirective, isStandalone: true, selector: "[orderable]", outputs: { reorder: "reorder", targetChanged: "targetChanged" }, queries: [{ propertyName: "draggables", predicate: DraggableDirective, descendants: true }], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: OrderableDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[orderable]'
                }]
        }], propDecorators: { reorder: [{
                type: Output
            }], targetChanged: [{
                type: Output
            }], draggables: [{
                type: ContentChildren,
                args: [DraggableDirective, { descendants: true }]
            }] } });

class DataTableHeaderComponent {
    constructor() {
        this.cd = inject(ChangeDetectorRef);
        this.scrollbarHelper = inject(ScrollbarHelper);
        this.enableClearingSortState = false;
        this.verticalScrollVisible = false;
        this.sort = new EventEmitter();
        this.reorder = new EventEmitter();
        this.resize = new EventEmitter();
        this.resizing = new EventEmitter();
        this.select = new EventEmitter();
        this.columnContextmenu = new EventEmitter(false);
        this._columnGroupWidths = {
            total: 100
        };
        this._styleByGroup = { left: {}, center: {}, right: {} };
        this.destroyed = false;
    }
    set innerWidth(val) {
        this._innerWidth = val;
        setTimeout(() => {
            if (this._columns) {
                const colByPin = columnsByPin(this._columns);
                this._columnGroupWidths = columnGroupWidths(colByPin, this._columns);
                this.setStylesByGroup();
            }
        });
    }
    get innerWidth() {
        return this._innerWidth;
    }
    set headerHeight(val) {
        if (val !== 'auto') {
            this._headerHeight = `${val}px`;
        }
        else {
            this._headerHeight = val;
        }
    }
    get headerHeight() {
        return this._headerHeight;
    }
    set columns(val) {
        this._columns = val;
        const colsByPin = columnsByPin(val);
        this._columnsByPin = columnsByPinArr(val);
        setTimeout(() => {
            this._columnGroupWidths = columnGroupWidths(colsByPin, val);
            this.setStylesByGroup();
        });
    }
    get columns() {
        return this._columns;
    }
    set offsetX(val) {
        this._offsetX = val;
        this.setStylesByGroup();
    }
    get offsetX() {
        return this._offsetX;
    }
    ngOnChanges(changes) {
        if (changes.verticalScrollVisible) {
            this._styleByGroup.right = this.calcStylesByGroup('right');
            if (!this.destroyed) {
                this.cd.detectChanges();
            }
        }
    }
    ngOnDestroy() {
        this.destroyed = true;
    }
    onLongPressStart({ event, model }) {
        model.dragging = true;
        this.dragEventTarget = event;
    }
    onLongPressEnd({ model }) {
        this.dragEventTarget = undefined;
        // delay resetting so sort can be
        // prevented if we were dragging
        setTimeout(() => {
            // datatable component creates copies from columns on reorder
            // set dragging to false on new objects
            const column = this._columns.find(c => c.$$id === model.$$id);
            if (column && 'dragging' in column) {
                column.dragging = false;
            }
        }, 5);
    }
    get headerWidth() {
        if (this.scrollbarH) {
            const width = this.verticalScrollVisible
                ? this.innerWidth - this.scrollbarHelper.width
                : this.innerWidth;
            return width + 'px';
        }
        return '100%';
    }
    onColumnResized({ width, column }) {
        this.resize.emit(this.makeResizeEvent(width, column));
    }
    onColumnResizing({ width, column }) {
        this.resizing.emit(this.makeResizeEvent(width, column));
    }
    makeResizeEvent(width, column) {
        if (column.minWidth && width <= column.minWidth) {
            width = column.minWidth;
        }
        else if (column.maxWidth && width >= column.maxWidth) {
            width = column.maxWidth;
        }
        return {
            column,
            prevValue: column.width,
            newValue: width
        };
    }
    onColumnReordered(event) {
        const column = this.getColumn(event.newValue);
        column.isTarget = false;
        column.targetMarkerContext = undefined;
        this.reorder.emit(event);
    }
    onTargetChanged({ prevIndex, newIndex, initialIndex }) {
        if (prevIndex || prevIndex === 0) {
            const oldColumn = this.getColumn(prevIndex);
            oldColumn.isTarget = false;
            oldColumn.targetMarkerContext = undefined;
        }
        if (newIndex || newIndex === 0) {
            const newColumn = this.getColumn(newIndex);
            newColumn.isTarget = true;
            if (initialIndex !== newIndex) {
                newColumn.targetMarkerContext = {
                    class: 'targetMarker '.concat(initialIndex > newIndex ? 'dragFromRight' : 'dragFromLeft')
                };
            }
        }
    }
    getColumn(index) {
        const leftColumnCount = this._columnsByPin[0].columns.length;
        if (index < leftColumnCount) {
            return this._columnsByPin[0].columns[index];
        }
        const centerColumnCount = this._columnsByPin[1].columns.length;
        if (index < leftColumnCount + centerColumnCount) {
            return this._columnsByPin[1].columns[index - leftColumnCount];
        }
        return this._columnsByPin[2].columns[index - leftColumnCount - centerColumnCount];
    }
    onSort({ column, prevValue, newValue }) {
        // if we are dragging don't sort!
        if (column.dragging) {
            return;
        }
        const sorts = this.calcNewSorts(column, prevValue, newValue);
        this.sort.emit({
            sorts,
            column,
            prevValue,
            newValue
        });
    }
    calcNewSorts(column, prevValue, newValue) {
        let idx = 0;
        if (!this.sorts) {
            this.sorts = [];
        }
        const sorts = this.sorts.map((s, i) => {
            s = { ...s };
            if (s.prop === column.prop) {
                idx = i;
            }
            return s;
        });
        if (newValue === undefined) {
            sorts.splice(idx, 1);
        }
        else if (prevValue) {
            sorts[idx].dir = newValue;
        }
        else {
            if (this.sortType === SortType.single) {
                sorts.splice(0, this.sorts.length);
            }
            sorts.push({ dir: newValue, prop: column.prop });
        }
        return sorts;
    }
    setStylesByGroup() {
        this._styleByGroup.left = this.calcStylesByGroup('left');
        this._styleByGroup.center = this.calcStylesByGroup('center');
        this._styleByGroup.right = this.calcStylesByGroup('right');
        if (!this.destroyed) {
            this.cd.detectChanges();
        }
    }
    calcStylesByGroup(group) {
        const widths = this._columnGroupWidths;
        if (group === 'center') {
            return {
                transform: `translateX(${this.offsetX * -1}px)`,
                width: `${widths[group]}px`,
                willChange: 'transform'
            };
        }
        return {
            width: `${widths[group]}px`
        };
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableHeaderComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "20.0.5", type: DataTableHeaderComponent, isStandalone: true, selector: "datatable-header", inputs: { sortAscendingIcon: "sortAscendingIcon", sortDescendingIcon: "sortDescendingIcon", sortUnsetIcon: "sortUnsetIcon", scrollbarH: "scrollbarH", dealsWithGroup: "dealsWithGroup", targetMarkerTemplate: "targetMarkerTemplate", enableClearingSortState: "enableClearingSortState", innerWidth: "innerWidth", sorts: "sorts", sortType: "sortType", allRowsSelected: "allRowsSelected", selectionType: "selectionType", reorderable: "reorderable", verticalScrollVisible: "verticalScrollVisible", headerHeight: "headerHeight", columns: "columns", offsetX: "offsetX" }, outputs: { sort: "sort", reorder: "reorder", resize: "resize", resizing: "resizing", select: "select", columnContextmenu: "columnContextmenu" }, host: { properties: { "style.height": "this.headerHeight", "style.width": "this.headerWidth" }, classAttribute: "datatable-header" }, usesOnChanges: true, ngImport: i0, template: `
    <div
      role="row"
      orderable
      (reorder)="onColumnReordered($event)"
      (targetChanged)="onTargetChanged($event)"
      [style.width.px]="_columnGroupWidths.total"
      class="datatable-header-inner"
    >
      @for (colGroup of _columnsByPin; track colGroup.type) { @if (colGroup.columns.length) {
      <div
        class="datatable-row-group"
        [ngClass]="'datatable-row-' + colGroup.type"
        [ngStyle]="_styleByGroup[colGroup.type]"
      >
        @for (column of colGroup.columns; track column.$$id) {
        <datatable-header-cell
          role="columnheader"
          (resize)="onColumnResized($event)"
          (resizing)="onColumnResizing($event)"
          long-press
          [pressModel]="column"
          [pressEnabled]="reorderable && column.draggable"
          (longPressStart)="onLongPressStart($event)"
          (longPressEnd)="onLongPressEnd($event)"
          draggable
          [dragX]="reorderable && column.draggable && column.dragging"
          [dragY]="false"
          [dragModel]="column"
          [dragEventTarget]="dragEventTarget"
          [headerHeight]="headerHeight"
          [isTarget]="column.isTarget"
          [targetMarkerTemplate]="targetMarkerTemplate"
          [targetMarkerContext]="column.targetMarkerContext"
          [column]="column"
          [sortType]="sortType"
          [sorts]="sorts"
          [selectionType]="selectionType"
          [sortAscendingIcon]="sortAscendingIcon"
          [sortDescendingIcon]="sortDescendingIcon"
          [sortUnsetIcon]="sortUnsetIcon"
          [allRowsSelected]="allRowsSelected"
          [enableClearingSortState]="enableClearingSortState"
          (sort)="onSort($event)"
          (select)="select.emit($event)"
          (columnContextmenu)="columnContextmenu.emit($event)"
        >
        </datatable-header-cell>
        }
      </div>
      } }
    </div>
  `, isInline: true, styles: [":host{display:block;overflow:hidden}.datatable-header-inner{display:flex}:host-context(ngx-datatable.fixed-header) .datatable-header-inner{white-space:nowrap}.datatable-row-group{display:flex}.datatable-row-left,.datatable-row-right{position:sticky;z-index:9}.datatable-row-left{left:0}.datatable-row-right{right:0}\n"], dependencies: [{ kind: "directive", type: OrderableDirective, selector: "[orderable]", outputs: ["reorder", "targetChanged"] }, { kind: "directive", type: NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { kind: "component", type: DataTableHeaderCellComponent, selector: "datatable-header-cell", inputs: ["sortType", "sortAscendingIcon", "sortDescendingIcon", "sortUnsetIcon", "isTarget", "targetMarkerTemplate", "targetMarkerContext", "enableClearingSortState", "allRowsSelected", "selectionType", "column", "headerHeight", "sorts"], outputs: ["sort", "select", "columnContextmenu", "resize", "resizing"] }, { kind: "directive", type: LongPressDirective, selector: "[long-press]", inputs: ["pressEnabled", "pressModel", "duration"], outputs: ["longPressStart", "longPressEnd"] }, { kind: "directive", type: DraggableDirective, selector: "[draggable]", inputs: ["dragEventTarget", "dragModel", "dragX", "dragY"], outputs: ["dragStart", "dragging", "dragEnd"] }, { kind: "directive", type: NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableHeaderComponent, decorators: [{
            type: Component,
            args: [{ selector: 'datatable-header', template: `
    <div
      role="row"
      orderable
      (reorder)="onColumnReordered($event)"
      (targetChanged)="onTargetChanged($event)"
      [style.width.px]="_columnGroupWidths.total"
      class="datatable-header-inner"
    >
      @for (colGroup of _columnsByPin; track colGroup.type) { @if (colGroup.columns.length) {
      <div
        class="datatable-row-group"
        [ngClass]="'datatable-row-' + colGroup.type"
        [ngStyle]="_styleByGroup[colGroup.type]"
      >
        @for (column of colGroup.columns; track column.$$id) {
        <datatable-header-cell
          role="columnheader"
          (resize)="onColumnResized($event)"
          (resizing)="onColumnResizing($event)"
          long-press
          [pressModel]="column"
          [pressEnabled]="reorderable && column.draggable"
          (longPressStart)="onLongPressStart($event)"
          (longPressEnd)="onLongPressEnd($event)"
          draggable
          [dragX]="reorderable && column.draggable && column.dragging"
          [dragY]="false"
          [dragModel]="column"
          [dragEventTarget]="dragEventTarget"
          [headerHeight]="headerHeight"
          [isTarget]="column.isTarget"
          [targetMarkerTemplate]="targetMarkerTemplate"
          [targetMarkerContext]="column.targetMarkerContext"
          [column]="column"
          [sortType]="sortType"
          [sorts]="sorts"
          [selectionType]="selectionType"
          [sortAscendingIcon]="sortAscendingIcon"
          [sortDescendingIcon]="sortDescendingIcon"
          [sortUnsetIcon]="sortUnsetIcon"
          [allRowsSelected]="allRowsSelected"
          [enableClearingSortState]="enableClearingSortState"
          (sort)="onSort($event)"
          (select)="select.emit($event)"
          (columnContextmenu)="columnContextmenu.emit($event)"
        >
        </datatable-header-cell>
        }
      </div>
      } }
    </div>
  `, host: {
                        class: 'datatable-header'
                    }, changeDetection: ChangeDetectionStrategy.OnPush, imports: [
                        OrderableDirective,
                        NgStyle,
                        DataTableHeaderCellComponent,
                        LongPressDirective,
                        DraggableDirective,
                        NgClass
                    ], styles: [":host{display:block;overflow:hidden}.datatable-header-inner{display:flex}:host-context(ngx-datatable.fixed-header) .datatable-header-inner{white-space:nowrap}.datatable-row-group{display:flex}.datatable-row-left,.datatable-row-right{position:sticky;z-index:9}.datatable-row-left{left:0}.datatable-row-right{right:0}\n"] }]
        }], propDecorators: { sortAscendingIcon: [{
                type: Input
            }], sortDescendingIcon: [{
                type: Input
            }], sortUnsetIcon: [{
                type: Input
            }], scrollbarH: [{
                type: Input
            }], dealsWithGroup: [{
                type: Input
            }], targetMarkerTemplate: [{
                type: Input
            }], enableClearingSortState: [{
                type: Input
            }], innerWidth: [{
                type: Input
            }], sorts: [{
                type: Input
            }], sortType: [{
                type: Input
            }], allRowsSelected: [{
                type: Input
            }], selectionType: [{
                type: Input
            }], reorderable: [{
                type: Input
            }], verticalScrollVisible: [{
                type: Input
            }], headerHeight: [{
                type: HostBinding,
                args: ['style.height']
            }, {
                type: Input
            }], columns: [{
                type: Input
            }], offsetX: [{
                type: Input
            }], sort: [{
                type: Output
            }], reorder: [{
                type: Output
            }], resize: [{
                type: Output
            }], resizing: [{
                type: Output
            }], select: [{
                type: Output
            }], columnContextmenu: [{
                type: Output
            }], headerWidth: [{
                type: HostBinding,
                args: ['style.width']
            }] } });

/**
 * Throttle a function
 */
function throttle(func, wait, options) {
    options = options || {};
    let context;
    let args;
    let result;
    let timeout = null;
    let previous = 0;
    function later() {
        previous = options.leading === false ? 0 : +new Date();
        timeout = null;
        result = func.apply(context, args);
    }
    return function () {
        const now = +new Date();
        if (!previous && options.leading === false) {
            previous = now;
        }
        const remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0) {
            clearTimeout(timeout);
            timeout = null;
            previous = now;
            result = func.apply(context, args);
        }
        else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };
}
/**
 * Throttle decorator
 *
 *  class MyClass {
 *    throttleable(10)
 *    myFn() { ... }
 *  }
 */
function throttleable(duration, options) {
    return function innerDecorator(target, key, descriptor) {
        return {
            configurable: true,
            enumerable: descriptor.enumerable,
            get: function getter() {
                Object.defineProperty(this, key, {
                    configurable: true,
                    enumerable: descriptor.enumerable,
                    value: throttle(descriptor.value, duration, options)
                });
                return target[key];
            }
        };
    };
}

/**
 * Calculates the Total Flex Grow
 */
function getTotalFlexGrow(columns) {
    let totalFlexGrow = 0;
    for (const c of columns) {
        totalFlexGrow += c.flexGrow || 0;
    }
    return totalFlexGrow;
}
/**
 * Adjusts the column widths.
 * Inspired by: https://github.com/facebook/fixed-data-table/blob/master/src/FixedDataTableWidthHelper.js
 */
function adjustColumnWidths(allColumns, expectedWidth) {
    const columnsWidth = columnTotalWidth(allColumns);
    const totalFlexGrow = getTotalFlexGrow(allColumns);
    const colsByGroup = columnsByPin(allColumns);
    if (columnsWidth !== expectedWidth) {
        scaleColumns(colsByGroup, expectedWidth, totalFlexGrow);
    }
}
/**
 * Resizes columns based on the flexGrow property, while respecting manually set widths
 */
function scaleColumns(colsByGroup, maxWidth, totalFlexGrow) {
    // calculate total width and flexgrow points for columns that can be resized
    for (const column of Object.values(colsByGroup).flat()) {
        if (column.$$oldWidth) {
            // when manually resized, switch off auto-resize
            column.canAutoResize = false;
        }
        if (!column.canAutoResize) {
            maxWidth -= column.width;
            totalFlexGrow -= column.flexGrow ? column.flexGrow : 0;
        }
        else {
            column.width = 0;
        }
    }
    const hasMinWidth = {};
    let remainingWidth = maxWidth;
    // resize columns until no width is left to be distributed
    do {
        const widthPerFlexPoint = remainingWidth / totalFlexGrow;
        remainingWidth = 0;
        for (const column of Object.values(colsByGroup).flat()) {
            // if the column can be resize and it hasn't reached its minimum width yet
            if (column.canAutoResize && !hasMinWidth[column.prop]) {
                const newWidth = column.width + column.flexGrow * widthPerFlexPoint;
                if (column.minWidth !== undefined && newWidth < column.minWidth) {
                    remainingWidth += newWidth - column.minWidth;
                    column.width = column.minWidth;
                    hasMinWidth[column.prop] = true;
                }
                else {
                    column.width = newWidth;
                }
            }
        }
    } while (remainingWidth !== 0);
    // Adjust for any remaining offset in computed widths vs maxWidth
    const columns = Object.values(colsByGroup).reduce((acc, col) => acc.concat(col), []);
    const totalWidthAchieved = columns.reduce((acc, col) => acc + col.width, 0);
    const delta = maxWidth - totalWidthAchieved;
    if (delta === 0) {
        return;
    }
    // adjust the first column that can be auto-resized respecting the min/max widths
    for (const col of columns.filter(c => c.canAutoResize).sort((a, b) => a.width - b.width)) {
        if ((delta > 0 && (!col.maxWidth || col.width + delta <= col.maxWidth)) ||
            (delta < 0 && (!col.minWidth || col.width + delta >= col.minWidth))) {
            col.width += delta;
            break;
        }
    }
}
/**
 * Forces the width of the columns to
 * distribute equally but overflowing when necessary
 *
 * Rules:
 *
 *  - If combined withs are less than the total width of the grid,
 *    proportion the widths given the min / max / normal widths to fill the width.
 *
 *  - If the combined widths, exceed the total width of the grid,
 *    use the standard widths.
 *
 *  - If a column is resized, it should always use that width
 *
 *  - The proportional widths should never fall below min size if specified.
 *
 *  - If the grid starts off small but then becomes greater than the size ( + / - )
 *    the width should use the original width; not the newly proportioned widths.
 */
function forceFillColumnWidths(allColumns, expectedWidth, startIdx, allowBleed, defaultColWidth = 150, verticalScrollWidth = 0) {
    const columnsToResize = allColumns
        .slice(startIdx + 1, allColumns.length)
        .filter(c => c.canAutoResize !== false);
    for (const column of columnsToResize) {
        if (!column.$$oldWidth) {
            column.$$oldWidth = column.width;
        }
    }
    let additionWidthPerColumn = 0;
    let exceedsWindow = false;
    let contentWidth = getContentWidth(allColumns, defaultColWidth);
    let remainingWidth = expectedWidth - contentWidth;
    const initialRemainingWidth = remainingWidth;
    const columnsProcessed = [];
    const remainingWidthLimit = 1; // when to stop
    // This loop takes care of the
    do {
        additionWidthPerColumn = remainingWidth / columnsToResize.length;
        exceedsWindow = contentWidth >= expectedWidth;
        for (const column of columnsToResize) {
            // don't bleed if the initialRemainingWidth is same as verticalScrollWidth
            if (exceedsWindow && allowBleed && initialRemainingWidth !== -1 * verticalScrollWidth) {
                column.width = column.$$oldWidth || column.width || defaultColWidth;
            }
            else {
                const newSize = (column.width || defaultColWidth) + additionWidthPerColumn;
                if (column.minWidth && newSize < column.minWidth) {
                    column.width = column.minWidth;
                    columnsProcessed.push(column);
                }
                else if (column.maxWidth && newSize > column.maxWidth) {
                    column.width = column.maxWidth;
                    columnsProcessed.push(column);
                }
                else {
                    column.width = newSize;
                }
            }
            column.width = Math.max(0, column.width);
        }
        contentWidth = getContentWidth(allColumns, defaultColWidth);
        remainingWidth = expectedWidth - contentWidth;
        removeProcessedColumns(columnsToResize, columnsProcessed);
    } while (remainingWidth > remainingWidthLimit && columnsToResize.length !== 0);
    // reset so we don't have stale values
    for (const column of columnsToResize) {
        column.$$oldWidth = 0;
    }
}
/**
 * Remove the processed columns from the current active columns.
 */
function removeProcessedColumns(columnsToResize, columnsProcessed) {
    for (const column of columnsProcessed) {
        const index = columnsToResize.indexOf(column);
        columnsToResize.splice(index, 1);
    }
}
/**
 * Gets the width of the columns
 */
function getContentWidth(allColumns, defaultColWidth = 150) {
    let contentWidth = 0;
    for (const column of allColumns) {
        contentWidth += column.width || defaultColWidth;
    }
    return contentWidth;
}

class DataTablePagerComponent {
    constructor() {
        this.dataTable = inject(DatatableComponent, { optional: true });
        this.change = new EventEmitter();
        this._count = 0;
        this._page = 1;
        this._size = 0;
    }
    get messages() {
        return this.dataTable?.messages ?? {};
    }
    set size(val) {
        this._size = val;
        this.pages = this.calcPages();
    }
    get size() {
        return this._size;
    }
    set count(val) {
        this._count = val;
        this.pages = this.calcPages();
    }
    get count() {
        return this._count;
    }
    set page(val) {
        this._page = val;
        this.pages = this.calcPages();
    }
    get page() {
        return this._page;
    }
    get totalPages() {
        const count = this.size < 1 ? 1 : Math.ceil(this.count / this.size);
        return Math.max(count || 0, 1);
    }
    canPrevious() {
        return this.page > 1;
    }
    canNext() {
        return this.page < this.totalPages;
    }
    prevPage() {
        this.selectPage(this.page - 1);
    }
    nextPage() {
        this.selectPage(this.page + 1);
    }
    selectPage(page) {
        if (page > 0 && page <= this.totalPages && page !== this.page) {
            this.page = page;
            this.change.emit({
                page
            });
        }
    }
    calcPages(page) {
        const pages = [];
        let startPage = 1;
        let endPage = this.totalPages;
        const maxSize = 5;
        const isMaxSized = maxSize < this.totalPages;
        page = page || this.page;
        if (isMaxSized) {
            startPage = page - Math.floor(maxSize / 2);
            endPage = page + Math.floor(maxSize / 2);
            if (startPage < 1) {
                startPage = 1;
                endPage = Math.min(startPage + maxSize - 1, this.totalPages);
            }
            else if (endPage > this.totalPages) {
                startPage = Math.max(this.totalPages - maxSize + 1, 1);
                endPage = this.totalPages;
            }
        }
        for (let num = startPage; num <= endPage; num++) {
            pages.push({
                number: num,
                text: num
            });
        }
        return pages;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTablePagerComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "20.0.5", type: DataTablePagerComponent, isStandalone: true, selector: "datatable-pager", inputs: { pagerLeftArrowIcon: "pagerLeftArrowIcon", pagerRightArrowIcon: "pagerRightArrowIcon", pagerPreviousIcon: "pagerPreviousIcon", pagerNextIcon: "pagerNextIcon", size: "size", count: "count", page: "page" }, outputs: { change: "change" }, host: { classAttribute: "datatable-pager" }, ngImport: i0, template: `
    <ul class="pager">
      <li [class.disabled]="!canPrevious()">
        <a
          role="button"
          [attr.aria-label]="messages.ariaFirstPageMessage ?? 'go to first page'"
          (click)="selectPage(1)"
        >
          <i class="{{ pagerPreviousIcon ?? 'datatable-icon-prev' }}"></i>
        </a>
      </li>
      <li [class.disabled]="!canPrevious()">
        <a
          role="button"
          [attr.aria-label]="messages.ariaPreviousPageMessage ?? 'go to previous page'"
          (click)="prevPage()"
        >
          <i class="{{ pagerLeftArrowIcon ?? 'datatable-icon-left' }}"></i>
        </a>
      </li>
      @for (pg of pages; track pg.number) {
      <li
        [attr.aria-label]="(messages.ariaPageNMessage ?? 'page') + ' ' + pg.number"
        class="pages"
        [class.active]="pg.number === page"
      >
        <a role="button" (click)="selectPage(pg.number)">
          {{ pg.text }}
        </a>
      </li>
      }
      <li [class.disabled]="!canNext()">
        <a
          role="button"
          [attr.aria-label]="messages.ariaNextPageMessage ?? 'go to next page'"
          (click)="nextPage()"
        >
          <i class="{{ pagerRightArrowIcon ?? 'datatable-icon-right' }}"></i>
        </a>
      </li>
      <li [class.disabled]="!canNext()">
        <a
          role="button"
          [attr.aria-label]="messages.ariaLastPageMessage ?? 'go to last page'"
          (click)="selectPage(totalPages)"
        >
          <i class="{{ pagerNextIcon ?? 'datatable-icon-skip' }}"></i>
        </a>
      </li>
    </ul>
  `, isInline: true, styles: [":host-context(datatable-footer .selected-count) .datatable-pager{flex:1 1 60%}:host{flex:1 1 80%;text-align:right}.pager,.pager li{padding:0;margin:0;display:inline-block;list-style:none}.pager li,.pager li a{outline:none}.pager li a{cursor:pointer;display:inline-block}.pager li.disabled a{cursor:not-allowed}\n"], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTablePagerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'datatable-pager', template: `
    <ul class="pager">
      <li [class.disabled]="!canPrevious()">
        <a
          role="button"
          [attr.aria-label]="messages.ariaFirstPageMessage ?? 'go to first page'"
          (click)="selectPage(1)"
        >
          <i class="{{ pagerPreviousIcon ?? 'datatable-icon-prev' }}"></i>
        </a>
      </li>
      <li [class.disabled]="!canPrevious()">
        <a
          role="button"
          [attr.aria-label]="messages.ariaPreviousPageMessage ?? 'go to previous page'"
          (click)="prevPage()"
        >
          <i class="{{ pagerLeftArrowIcon ?? 'datatable-icon-left' }}"></i>
        </a>
      </li>
      @for (pg of pages; track pg.number) {
      <li
        [attr.aria-label]="(messages.ariaPageNMessage ?? 'page') + ' ' + pg.number"
        class="pages"
        [class.active]="pg.number === page"
      >
        <a role="button" (click)="selectPage(pg.number)">
          {{ pg.text }}
        </a>
      </li>
      }
      <li [class.disabled]="!canNext()">
        <a
          role="button"
          [attr.aria-label]="messages.ariaNextPageMessage ?? 'go to next page'"
          (click)="nextPage()"
        >
          <i class="{{ pagerRightArrowIcon ?? 'datatable-icon-right' }}"></i>
        </a>
      </li>
      <li [class.disabled]="!canNext()">
        <a
          role="button"
          [attr.aria-label]="messages.ariaLastPageMessage ?? 'go to last page'"
          (click)="selectPage(totalPages)"
        >
          <i class="{{ pagerNextIcon ?? 'datatable-icon-skip' }}"></i>
        </a>
      </li>
    </ul>
  `, host: {
                        class: 'datatable-pager'
                    }, changeDetection: ChangeDetectionStrategy.OnPush, styles: [":host-context(datatable-footer .selected-count) .datatable-pager{flex:1 1 60%}:host{flex:1 1 80%;text-align:right}.pager,.pager li{padding:0;margin:0;display:inline-block;list-style:none}.pager li,.pager li a{outline:none}.pager li a{cursor:pointer;display:inline-block}.pager li.disabled a{cursor:not-allowed}\n"] }]
        }], propDecorators: { pagerLeftArrowIcon: [{
                type: Input
            }], pagerRightArrowIcon: [{
                type: Input
            }], pagerPreviousIcon: [{
                type: Input
            }], pagerNextIcon: [{
                type: Input
            }], size: [{
                type: Input
            }], count: [{
                type: Input
            }], page: [{
                type: Input
            }], change: [{
                type: Output
            }] } });

class DataTableFooterComponent {
    constructor() {
        this.selectedCount = 0;
        this.page = new EventEmitter();
    }
    get isVisible() {
        return this.rowCount / this.pageSize > 1;
    }
    get curPage() {
        return this.offset + 1;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableFooterComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "20.0.5", type: DataTableFooterComponent, isStandalone: true, selector: "datatable-footer", inputs: { footerHeight: "footerHeight", rowCount: "rowCount", pageSize: "pageSize", offset: "offset", pagerLeftArrowIcon: "pagerLeftArrowIcon", pagerRightArrowIcon: "pagerRightArrowIcon", pagerPreviousIcon: "pagerPreviousIcon", pagerNextIcon: "pagerNextIcon", totalMessage: "totalMessage", footerTemplate: "footerTemplate", selectedCount: "selectedCount", selectedMessage: "selectedMessage" }, outputs: { page: "page" }, host: { classAttribute: "datatable-footer" }, ngImport: i0, template: `
    <div
      class="datatable-footer-inner"
      [ngClass]="{ 'selected-count': selectedMessage }"
      [style.height.px]="footerHeight"
    >
      @if (footerTemplate?.template) {
      <ng-template
        [ngTemplateOutlet]="footerTemplate!.template!"
        [ngTemplateOutletContext]="{
          rowCount: rowCount,
          pageSize: pageSize,
          selectedCount: selectedCount,
          curPage: curPage,
          offset: offset
        }"
      >
      </ng-template>
      } @else {
      <div class="page-count">
        @if (selectedMessage) {
        <span> {{ selectedCount?.toLocaleString() }} {{ selectedMessage }} / </span>
        }
        {{ rowCount?.toLocaleString() }} {{ totalMessage }}
      </div>
      @if (isVisible) {
      <datatable-pager
        [pagerLeftArrowIcon]="pagerLeftArrowIcon"
        [pagerRightArrowIcon]="pagerRightArrowIcon"
        [pagerPreviousIcon]="pagerPreviousIcon"
        [pagerNextIcon]="pagerNextIcon"
        [page]="curPage"
        [size]="pageSize"
        [count]="rowCount"
        (change)="page.emit($event)"
      >
      </datatable-pager>
      } }
    </div>
  `, isInline: true, styles: [":host{display:block;width:100%;overflow:auto}.datatable-footer-inner{display:flex;align-items:center;width:100%}.page-count{flex:1 1 20%}.selected-count .page-count{flex:1 1 40%}\n"], dependencies: [{ kind: "directive", type: NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: DataTablePagerComponent, selector: "datatable-pager", inputs: ["pagerLeftArrowIcon", "pagerRightArrowIcon", "pagerPreviousIcon", "pagerNextIcon", "size", "count", "page"], outputs: ["change"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DataTableFooterComponent, decorators: [{
            type: Component,
            args: [{ selector: 'datatable-footer', template: `
    <div
      class="datatable-footer-inner"
      [ngClass]="{ 'selected-count': selectedMessage }"
      [style.height.px]="footerHeight"
    >
      @if (footerTemplate?.template) {
      <ng-template
        [ngTemplateOutlet]="footerTemplate!.template!"
        [ngTemplateOutletContext]="{
          rowCount: rowCount,
          pageSize: pageSize,
          selectedCount: selectedCount,
          curPage: curPage,
          offset: offset
        }"
      >
      </ng-template>
      } @else {
      <div class="page-count">
        @if (selectedMessage) {
        <span> {{ selectedCount?.toLocaleString() }} {{ selectedMessage }} / </span>
        }
        {{ rowCount?.toLocaleString() }} {{ totalMessage }}
      </div>
      @if (isVisible) {
      <datatable-pager
        [pagerLeftArrowIcon]="pagerLeftArrowIcon"
        [pagerRightArrowIcon]="pagerRightArrowIcon"
        [pagerPreviousIcon]="pagerPreviousIcon"
        [pagerNextIcon]="pagerNextIcon"
        [page]="curPage"
        [size]="pageSize"
        [count]="rowCount"
        (change)="page.emit($event)"
      >
      </datatable-pager>
      } }
    </div>
  `, host: {
                        class: 'datatable-footer'
                    }, changeDetection: ChangeDetectionStrategy.OnPush, imports: [NgClass, NgTemplateOutlet, DataTablePagerComponent], styles: [":host{display:block;width:100%;overflow:auto}.datatable-footer-inner{display:flex;align-items:center;width:100%}.page-count{flex:1 1 20%}.selected-count .page-count{flex:1 1 40%}\n"] }]
        }], propDecorators: { footerHeight: [{
                type: Input
            }], rowCount: [{
                type: Input
            }], pageSize: [{
                type: Input
            }], offset: [{
                type: Input
            }], pagerLeftArrowIcon: [{
                type: Input
            }], pagerRightArrowIcon: [{
                type: Input
            }], pagerPreviousIcon: [{
                type: Input
            }], pagerNextIcon: [{
                type: Input
            }], totalMessage: [{
                type: Input
            }], footerTemplate: [{
                type: Input
            }], selectedCount: [{
                type: Input
            }], selectedMessage: [{
                type: Input
            }], page: [{
                type: Output
            }] } });

/**
 * Visibility Observer Directive
 *
 * Usage:
 *
 * 		<div
 * 			visibilityObserver
 * 			(visible)="onVisible($event)">
 * 		</div>
 *
 */
class VisibilityDirective {
    constructor() {
        this.element = inject(ElementRef);
        this.zone = inject(NgZone);
        this.isVisible = false;
        this.visible = new EventEmitter();
    }
    ngOnInit() {
        this.runCheck();
    }
    ngOnDestroy() {
        clearTimeout(this.timeout);
    }
    onVisibilityChange() {
        // trigger zone recalc for columns
        this.zone.run(() => {
            this.isVisible = true;
            this.visible.emit(true);
        });
    }
    runCheck() {
        const check = () => {
            // https://davidwalsh.name/offsetheight-visibility
            const { offsetHeight, offsetWidth } = this.element.nativeElement;
            if (offsetHeight && offsetWidth) {
                clearTimeout(this.timeout);
                this.onVisibilityChange();
            }
            else {
                clearTimeout(this.timeout);
                this.zone.runOutsideAngular(() => {
                    this.timeout = setTimeout(() => check(), 50);
                });
            }
        };
        this.timeout = setTimeout(() => check());
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: VisibilityDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "20.0.5", type: VisibilityDirective, isStandalone: true, selector: "[visibilityObserver]", outputs: { visible: "visible" }, host: { properties: { "class.visible": "this.isVisible" } }, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: VisibilityDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[visibilityObserver]'
                }]
        }], propDecorators: { isVisible: [{
                type: HostBinding,
                args: ['class.visible']
            }], visible: [{
                type: Output
            }] } });

class ProgressBarComponent {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: ProgressBarComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "20.0.5", type: ProgressBarComponent, isStandalone: true, selector: "datatable-progress", ngImport: i0, template: `
    <div class="progress-linear" role="progressbar">
      <div class="container">
        <div class="bar"></div>
      </div>
    </div>
  `, isInline: true, changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: ProgressBarComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'datatable-progress',
                    template: `
    <div class="progress-linear" role="progressbar">
      <div class="container">
        <div class="bar"></div>
      </div>
    </div>
  `,
                    changeDetection: ChangeDetectionStrategy.OnPush
                }]
        }] });

/**
 * Converts strings from something to camel case
 * http://stackoverflow.com/questions/10425287/convert-dash-separated-string-to-camelcase
 */
function camelCase(str) {
    // Replace special characters with a space
    str = str.replace(/[^a-zA-Z0-9 ]/g, ' ');
    // put a space before an uppercase letter
    str = str.replace(/([a-z](?=[A-Z]))/g, '$1 ');
    // Lower case first character and some other stuff
    str = str
        .replace(/([^a-zA-Z0-9 ])|^[0-9]+/g, '')
        .trim()
        .toLowerCase();
    // uppercase characters preceded by a space or number
    str = str.replace(/([ 0-9]+)([a-zA-Z])/g, function (a, b, c) {
        return b.trim() + c.toUpperCase();
    });
    return str;
}
/**
 * Converts strings from camel case to words
 * http://stackoverflow.com/questions/7225407/convert-camelcasetext-to-camel-case-text
 */
function deCamelCase(str) {
    return str.replace(/([A-Z])/g, match => ` ${match}`).replace(/^./, match => match.toUpperCase());
}

/**
 * Creates a unique object id.
 * http://stackoverflow.com/questions/6248666/how-to-generate-short-uid-like-ax4j9z-in-js
 */
function id() {
    return ('0000' + ((Math.random() * Math.pow(36, 4)) << 0).toString(36)).slice(-4);
}

function toInternalColumn(columns, defaultColumnWidth = 150) {
    let hasTreeColumn = false;
    // TS fails to infer the type here.
    return columns.map(column => {
        const prop = column.prop ?? (column.name ? camelCase(column.name) : undefined);
        // Only one column should hold the tree view,
        // Thus if multiple columns are provided with
        // isTreeColumn as true, we take only the first one
        const isTreeColumn = !!column.isTreeColumn && !hasTreeColumn;
        hasTreeColumn = hasTreeColumn || isTreeColumn;
        // TODO: add check if prop or name is provided if sorting is enabled.
        return {
            ...column,
            $$id: id(),
            $$valueGetter: getterForProp(prop),
            prop,
            name: column.name ?? (prop ? deCamelCase(String(prop)) : ''),
            resizeable: column.resizeable ?? true,
            sortable: column.sortable ?? true,
            comparator: column.comparator ?? orderByComparator,
            draggable: column.draggable ?? true,
            canAutoResize: column.canAutoResize ?? true,
            width: column.width ?? defaultColumnWidth,
            isTreeColumn,
            // in case of the directive, those are getters, so call them explicitly.
            headerTemplate: column.headerTemplate,
            cellTemplate: column.cellTemplate,
            summaryTemplate: column.summaryTemplate,
            ghostCellTemplate: column.ghostCellTemplate
        }; // TS cannot cast here
    });
}
function isNullOrUndefined(value) {
    return value === null || value === undefined;
}

const NGX_DATATABLE_CONFIG = new InjectionToken('ngx-datatable.config');
/**
 * Provides a global configuration for ngx-datatable.
 *
 * @param overrides The overrides of the table configuration.
 */
function providedNgxDatatableConfig(overrides) {
    return {
        provide: NGX_DATATABLE_CONFIG,
        useValue: overrides
    };
}

class DatatableComponent {
    /**
     * Rows that are displayed in the table.
     */
    set rows(val) {
        this._rows = val ?? [];
        // This will ensure that datatable detects changes on doing like this rows = [...rows];
        this.rowDiffer.diff([]);
        if (val) {
            this._internalRows = [...val];
        }
    }
    /**
     * Gets the rows.
     */
    get rows() {
        return this._rows;
    }
    /**
     * This attribute allows the user to set the name of the column to group the data with
     */
    set groupRowsBy(val) {
        if (val) {
            this._groupRowsBy = val;
            if (this._groupRowsBy) {
                // creates a new array with the data grouped
                this.groupedRows = this.groupArrayBy(this._rows, this._groupRowsBy);
            }
        }
    }
    get groupRowsBy() {
        return this._groupRowsBy;
    }
    /**
     * Columns to be displayed.
     */
    set columns(val) {
        if (val) {
            this._internalColumns = toInternalColumn(val, this._defaultColumnWidth);
            this.recalculateColumns();
        }
        this._columns = val;
    }
    /**
     * Get the columns.
     */
    get columns() {
        return this._columns;
    }
    /**
     * The page size to be shown.
     * Default value: `undefined`
     */
    set limit(val) {
        this._limit = val;
        // recalculate sizes/etc
        this.recalculate();
    }
    /**
     * Gets the limit.
     */
    get limit() {
        return this._limit;
    }
    /**
     * The total count of all rows.
     * Default value: `0`
     */
    set count(val) {
        this._count = val;
        // recalculate sizes/etc
        this.recalculate();
    }
    /**
     * Gets the count.
     */
    get count() {
        return this._count;
    }
    /**
     * The current offset ( page - 1 ) shown.
     * Default value: `0`
     */
    set offset(val) {
        this._offset = val;
    }
    get offset() {
        return Math.max(Math.min(this._offset, Math.ceil(this.rowCount / this.pageSize) - 1), 0);
    }
    /**
     * Show ghost loaders on each cell.
     * Default value: `false`
     */
    set ghostLoadingIndicator(val) {
        this._ghostLoadingIndicator = val;
        if (val && this.scrollbarV && !this.externalPaging) {
            // in case where we don't have predefined total page length
            this.rows = [...this.rows, undefined]; // undefined row will render ghost cell row at the end of the page
        }
    }
    get ghostLoadingIndicator() {
        return this._ghostLoadingIndicator;
    }
    /**
     * CSS class applied if the header height if fixed height.
     */
    get isFixedHeader() {
        const headerHeight = this.headerHeight;
        return typeof headerHeight === 'string' ? headerHeight !== 'auto' : true;
    }
    /**
     * CSS class applied to the root element if
     * the row heights are fixed heights.
     */
    get isFixedRow() {
        return this.rowHeight !== 'auto';
    }
    /**
     * CSS class applied to root element if
     * vertical scrolling is enabled.
     */
    get isVertScroll() {
        return this.scrollbarV;
    }
    /**
     * CSS class applied to root element if
     * virtualization is enabled.
     */
    get isVirtualized() {
        return this.virtualization;
    }
    /**
     * CSS class applied to the root element
     * if the horziontal scrolling is enabled.
     */
    get isHorScroll() {
        return this.scrollbarH;
    }
    /**
     * CSS class applied to root element is selectable.
     */
    get isSelectable() {
        return this.selectionType !== undefined;
    }
    /**
     * CSS class applied to root is checkbox selection.
     */
    get isCheckboxSelection() {
        return this.selectionType === SelectionType.checkbox;
    }
    /**
     * CSS class applied to root if cell selection.
     */
    get isCellSelection() {
        return this.selectionType === SelectionType.cell;
    }
    /**
     * CSS class applied to root if single select.
     */
    get isSingleSelection() {
        return this.selectionType === SelectionType.single;
    }
    /**
     * CSS class added to root element if mulit select
     */
    get isMultiSelection() {
        return this.selectionType === SelectionType.multi;
    }
    /**
     * CSS class added to root element if mulit click select
     */
    get isMultiClickSelection() {
        return this.selectionType === SelectionType.multiClick;
    }
    /**
     * Returns if all rows are selected.
     */
    get allRowsSelected() {
        let allRowsSelected = this.rows && this.selected && this.selected.length === this.rows.length;
        if (this.bodyComponent && this.selectAllRowsOnPage) {
            const indexes = this.bodyComponent.indexes;
            const rowsOnPage = indexes().last - indexes().first;
            allRowsSelected = this.selected.length === rowsOnPage;
        }
        return this.selected && this.rows && this.rows.length !== 0 && allRowsSelected;
    }
    constructor() {
        this.scrollbarHelper = inject(ScrollbarHelper);
        this.cd = inject(ChangeDetectorRef);
        this.columnChangesService = inject(ColumnChangesService);
        this.configuration = inject(NGX_DATATABLE_CONFIG, { optional: true }) ??
            // This is the old injection token for backward compatibility.
            inject('configuration', { optional: true });
        /**
         * List of row objects that should be
         * represented as selected in the grid.
         * Default value: `[]`
         */
        this.selected = [];
        /**
         * Enable vertical scrollbars
         */
        this.scrollbarV = false;
        /**
         * Enable vertical scrollbars dynamically on demand.
         * Property `scrollbarV` needs to be set `true` too.
         * Width that is gained when no scrollbar is needed
         * is added to the inner table width.
         */
        this.scrollbarVDynamic = false;
        /**
         * Enable horz scrollbars
         */
        this.scrollbarH = false;
        /**
         * The row height; which is necessary
         * to calculate the height for the lazy rendering.
         */
        this.rowHeight = 30;
        /**
         * Type of column width distribution formula.
         * Example: flex, force, standard
         */
        this.columnMode = ColumnMode.standard;
        /**
         * The minimum header height in pixels.
         * Pass a falsey for no header
         */
        this.headerHeight = 30;
        /**
         * The minimum footer height in pixels.
         * Pass falsey for no footer
         */
        this.footerHeight = 0;
        /**
         * If the table should use external paging
         * otherwise its assumed that all data is preloaded.
         */
        this.externalPaging = false;
        /**
         * If the table should use external sorting or
         * the built-in basic sorting.
         */
        this.externalSorting = false;
        /**
         * Show the linear loading bar.
         * Default value: `false`
         */
        this.loadingIndicator = false;
        /**
         * Enable/Disable ability to re-order columns
         * by dragging them.
         */
        this.reorderable = true;
        /**
         * Swap columns on re-order columns or
         * move them.
         */
        this.swapColumns = true;
        /**
         * The type of sorting
         */
        this.sortType = SortType.single;
        /**
         * Array of sorted columns by property and type.
         * Default value: `[]`
         */
        this.sorts = [];
        /**
         * Css class overrides
         */
        this.cssClasses = {};
        /**
         * Message overrides for localization
         *
         * @defaultValue
         * ```
         * {
         *   emptyMessage: 'No data to display',
         *   totalMessage: 'total',
         *   selectedMessage: 'selected',
         *   ariaFirstPageMessage: 'go to first page',
         *   ariaPreviousPageMessage: 'go to previous page',
         *   ariaPageNMessage: 'page',
         *   ariaNextPageMessage: 'go to next page',
         *   ariaLastPageMessage: 'go to last page'
         * }
         * ```
         */
        this.messages = {};
        /**
         * A boolean you can use to set the detault behaviour of rows and groups
         * whether they will start expanded or not. If ommited the default is NOT expanded.
         *
         */
        this.groupExpansionDefault = false;
        /**
         * Property to which you can use for determining select all
         * rows on current page or not.
         */
        this.selectAllRowsOnPage = false;
        /**
         * A flag for row virtualization on / off
         */
        this.virtualization = true;
        /**
         * A flag for switching summary row on / off
         */
        this.summaryRow = false;
        /**
         * A height of summary row
         */
        this.summaryHeight = 30;
        /**
         * A property holds a summary row position: top/bottom
         */
        this.summaryPosition = 'top';
        /**
         * A flag to enable drag behavior of native HTML5 drag and drop API on rows.
         * If set to true, {@link rowDragEvents} will emit dragstart and dragend events.
         */
        this.rowDraggable = false;
        /**
         * A flag to controll behavior of sort states.
         * By default sort on column toggles between ascending and descending without getting removed.
         * Set true to clear sorting of column after performing ascending and descending sort on that column.
         */
        this.enableClearingSortState = false;
        /**
         * Body was scrolled typically in a `scrollbarV:true` scenario.
         */
        this.scroll = new EventEmitter();
        /**
         * A cell or row was focused via keyboard or mouse click.
         */
        this.activate = new EventEmitter();
        /**
         * A cell or row was selected.
         */
        this.select = new EventEmitter();
        /**
         * Column sort was invoked.
         */
        this.sort = new EventEmitter();
        /**
         * The table was paged either triggered by the pager or the body scroll.
         */
        this.page = new EventEmitter();
        /**
         * Columns were re-ordered.
         */
        this.reorder = new EventEmitter();
        /**
         * Column was resized.
         */
        this.resize = new EventEmitter();
        /**
         * The context menu was invoked on the table.
         * type indicates whether the header or the body was clicked.
         * content contains either the column or the row that was clicked.
         */
        this.tableContextmenu = new EventEmitter(false);
        /**
         * A row was expanded ot collapsed for tree
         */
        this.treeAction = new EventEmitter();
        /**
         * Emits HTML5 native drag events.
         * Only emits dragenter, dragover, drop events by default.
         * Set {@link rowDraggble} to true for dragstart and dragend.
         */
        this.rowDragEvents = new EventEmitter();
        this.element = inject(ElementRef).nativeElement;
        this.rowDiffer = inject(KeyValueDiffers).find([]).create();
        this.rowCount = 0;
        this._offsetX = 0;
        this._count = 0;
        this._offset = 0;
        this._rows = [];
        this._internalRows = [];
        this._subscriptions = [];
        this._ghostLoadingIndicator = false;
        this.verticalScrollVisible = false;
        // In case horizontal scroll is enabled
        // the column widths are initially calculated without vertical scroll offset
        // this makes horizontal scroll to appear on load even if columns can fit in view
        // this will be set to true once rows are available and rendered on UI
        this._rowInitDone = signal(false);
        /**
         * This will be used when displaying or selecting rows.
         * when tracking/comparing them, we'll use the value of this fn,
         *
         * (`fn(x) === fn(y)` instead of `x === y`)
         */
        this.rowIdentity = x => {
            if (this._groupRowsBy) {
                // each group in groupedRows are stored as {key, value: [rows]},
                // where key is the groupRowsBy index
                return x.key ?? x;
            }
            else {
                return x;
            }
        };
        // apply global settings from Module.forRoot
        if (this.configuration) {
            if (this.configuration.messages) {
                this.messages = { ...this.configuration.messages };
            }
            if (this.configuration.cssClasses) {
                this.cssClasses = { ...this.configuration.cssClasses };
            }
            this.headerHeight = this.configuration.headerHeight ?? this.headerHeight;
            this.footerHeight = this.configuration.footerHeight ?? this.footerHeight;
            this.rowHeight = this.configuration.rowHeight ?? this.rowHeight;
            this._defaultColumnWidth = this.configuration.defaultColumnWidth ?? 150;
        }
    }
    /**
     * Lifecycle hook that is called after data-bound
     * properties of a directive are initialized.
     */
    ngOnInit() {
        // need to call this immediatly to size
        // if the table is hidden the visibility
        // listener will invoke this itself upon show
        this.recalculate();
    }
    /**
     * Lifecycle hook that is called after a component's
     * view has been fully initialized.
     */
    ngAfterViewInit() {
        // this has to be done to prevent the change detection
        // tree from freaking out because we are readjusting
        if (typeof requestAnimationFrame === 'undefined') {
            return;
        }
        requestAnimationFrame(() => {
            this.recalculate();
            // emit page for virtual server-side kickoff
            if (this.externalPaging && this.scrollbarV) {
                this.page.emit({
                    count: this.count,
                    pageSize: this.pageSize,
                    limit: this.limit,
                    offset: 0,
                    sorts: this.sorts
                });
            }
        });
    }
    /**
     * Lifecycle hook that is called after a component's
     * content has been fully initialized.
     */
    ngAfterContentInit() {
        if (this.columnTemplates.length) {
            this.translateColumns(this.columnTemplates);
        }
        this._subscriptions.push(this.columnTemplates.changes.subscribe(v => this.translateColumns(v)));
        this.listenForColumnInputChanges();
    }
    /**
     * Translates the templates to the column objects
     */
    translateColumns(val) {
        if (val) {
            if (val.length) {
                this._internalColumns = toInternalColumn(val, this._defaultColumnWidth);
                this.recalculateColumns();
                if (!this.externalSorting && this.rows?.length) {
                    this.sortInternalRows();
                }
                this.cd.markForCheck();
            }
        }
    }
    /**
     * Creates a map with the data grouped by the user choice of grouping index
     *
     * @param originalArray the original array passed via parameter
     * @param groupBy the key of the column to group the data by
     */
    groupArrayBy(originalArray, groupBy) {
        // create a map to hold groups with their corresponding results
        const map = new Map();
        let i = 0;
        originalArray.forEach(item => {
            if (!item) {
                // skip undefined items
                return;
            }
            const key = item[groupBy];
            const value = map.get(key);
            if (!value) {
                map.set(key, [item]);
            }
            else {
                value.push(item);
            }
            i++;
        });
        const addGroup = (key, value) => ({ key, value });
        // convert map back to a simple array of objects
        return Array.from(map, x => addGroup(x[0], x[1]));
    }
    /*
     * Lifecycle hook that is called when Angular dirty checks a directive.
     */
    ngDoCheck() {
        const rowDiffers = this.rowDiffer.diff(this.rows);
        if (rowDiffers || this.disableRowCheck) {
            // we don't sort again when ghost loader adds a dummy row
            if (!this.ghostLoadingIndicator && !this.externalSorting && this._internalColumns) {
                this.sortInternalRows();
            }
            else {
                this._internalRows = [...this.rows];
            }
            // auto group by parent on new update
            this._internalRows = groupRowsByParents(this._internalRows, optionalGetterForProp(this.treeFromRelation), optionalGetterForProp(this.treeToRelation));
            if (this._groupRowsBy) {
                // If a column has been specified in _groupRowsBy create a new array with the data grouped by that row
                this.groupedRows = this.groupArrayBy(this._rows, this._groupRowsBy);
            }
            if (rowDiffers) {
                queueMicrotask(() => {
                    this._rowInitDone.set(true);
                    this.recalculate();
                    this.cd.markForCheck();
                });
            }
            this.recalculatePages();
            this.cd.markForCheck();
        }
    }
    /**
     * Recalc's the sizes of the grid.
     *
     * Updated automatically on changes to:
     *
     *  - Columns
     *  - Rows
     *  - Paging related
     *
     * Also can be manually invoked or upon window resize.
     */
    recalculate() {
        this.recalculateDims();
        this.recalculateColumns();
        this.cd.markForCheck();
    }
    /**
     * Window resize handler to update sizes.
     */
    onWindowResize() {
        this.recalculate();
    }
    /**
     * Recalulcates the column widths based on column width
     * distribution mode and scrollbar offsets.
     */
    recalculateColumns(columns = this._internalColumns, forceIdx = -1, allowBleed = this.scrollbarH) {
        let width = this._innerWidth;
        if (!columns || !width) {
            return undefined;
        }
        const bodyElement = this.bodyElement?.nativeElement;
        this.verticalScrollVisible = bodyElement?.scrollHeight > bodyElement?.clientHeight;
        if (this.scrollbarV || this.scrollbarVDynamic) {
            width =
                width -
                    (this.verticalScrollVisible || !this._rowInitDone() ? this.scrollbarHelper.width : 0);
        }
        if (this.columnMode === ColumnMode.force) {
            forceFillColumnWidths(columns, width, forceIdx, allowBleed, this._defaultColumnWidth, this.scrollbarHelper.width);
        }
        else if (this.columnMode === ColumnMode.flex) {
            adjustColumnWidths(columns, width);
        }
        if (this.bodyComponent && this.bodyComponent.columnGroupWidths.total !== width) {
            this.bodyComponent.columns = [...this._internalColumns];
            this.bodyComponent.cd.markForCheck();
        }
        if (this.headerComponent && this.headerComponent._columnGroupWidths.total !== width) {
            this.headerComponent.columns = [...this._internalColumns];
        }
        return columns;
    }
    /**
     * Recalculates the dimensions of the table size.
     * Internally calls the page size and row count calcs too.
     *
     */
    recalculateDims() {
        const dims = this.element.getBoundingClientRect();
        this._innerWidth = Math.floor(dims.width);
        if (this.scrollbarV) {
            let height = dims.height;
            if (this.headerHeight) {
                height = height - this.headerHeight;
            }
            if (this.footerHeight) {
                height = height - this.footerHeight;
            }
            this.bodyHeight = height;
        }
        this.recalculatePages();
    }
    /**
     * Recalculates the pages after a update.
     */
    recalculatePages() {
        this.pageSize = this.calcPageSize();
        this.rowCount = this.calcRowCount();
    }
    /**
     * Body triggered a page event.
     */
    onBodyPage(offset) {
        // Avoid pagination caming from body events like scroll when the table
        // has no virtualization and the external paging is enable.
        // This means, let's the developer handle pagination by my him(her) self
        if (this.externalPaging && !this.virtualization) {
            return;
        }
        this.offset = offset;
        if (!isNaN(this.offset)) {
            this.page.emit({
                count: this.count,
                pageSize: this.pageSize,
                limit: this.limit,
                offset: this.offset,
                sorts: this.sorts
            });
        }
    }
    /**
     * The body triggered a scroll event.
     */
    onBodyScroll(event) {
        this._offsetX = event.offsetX;
        this.scroll.emit(event);
    }
    /**
     * The footer triggered a page event.
     */
    onFooterPage(event) {
        this.offset = event.page - 1;
        this.bodyComponent.updateOffsetY(this.offset);
        this.page.emit({
            count: this.count,
            pageSize: this.pageSize,
            limit: this.limit,
            offset: this.offset,
            sorts: this.sorts
        });
        if (this.selectAllRowsOnPage) {
            this.selected = [];
            this.select.emit({
                selected: this.selected
            });
        }
    }
    /**
     * Recalculates the sizes of the page
     */
    calcPageSize() {
        // Keep the page size constant even if the row has been expanded.
        // This is because an expanded row is still considered to be a child of
        // the original row.  Hence calculation would use rowHeight only.
        if (this.scrollbarV && this.virtualization) {
            const size = Math.ceil(this.bodyHeight / this.rowHeight);
            return Math.max(size, 0);
        }
        // if limit is passed, we are paging
        if (this.limit !== undefined) {
            return this.limit;
        }
        // otherwise use row length
        if (this.rows) {
            return this.rows.length;
        }
        // other empty :(
        return 0;
    }
    /**
     * Calculates the row count.
     */
    calcRowCount() {
        if (!this.externalPaging) {
            if (this.groupedRows) {
                return this.groupedRows.length;
            }
            else if (this.treeFromRelation != null && this.treeToRelation != null) {
                return this._internalRows.length;
            }
            else {
                return this.rows.length;
            }
        }
        return this.count;
    }
    /**
     * The header triggered a contextmenu event.
     */
    onColumnContextmenu({ event, column }) {
        this.tableContextmenu.emit({ event, type: ContextmenuType.header, content: column });
    }
    /**
     * The body triggered a contextmenu event.
     */
    onRowContextmenu({ event, row }) {
        this.tableContextmenu.emit({ event, type: ContextmenuType.body, content: row });
    }
    /**
     * The header triggered a column resize event.
     */
    onColumnResize({ column, newValue, prevValue }) {
        /* Safari/iOS 10.2 workaround */
        if (column === undefined) {
            return;
        }
        const idx = this._internalColumns.indexOf(column);
        const cols = this._internalColumns.map(col => ({ ...col }));
        cols[idx].width = newValue;
        // set this so we can force the column
        // width distribution to be to this value
        cols[idx].$$oldWidth = newValue;
        this.recalculateColumns(cols, idx);
        this._internalColumns = cols;
        this.resize.emit({
            column,
            newValue,
            prevValue
        });
    }
    onColumnResizing({ column, newValue }) {
        if (column === undefined) {
            return;
        }
        column.width = newValue;
        column.$$oldWidth = newValue;
        const idx = this._internalColumns.indexOf(column);
        this.recalculateColumns(this._internalColumns, idx);
    }
    /**
     * The header triggered a column re-order event.
     */
    onColumnReorder(event) {
        const { column, newValue, prevValue } = event;
        const cols = this._internalColumns.map(c => ({ ...c }));
        if (this.swapColumns) {
            const prevCol = cols[newValue];
            cols[newValue] = column;
            cols[prevValue] = prevCol;
        }
        else {
            if (newValue > prevValue) {
                const movedCol = cols[prevValue];
                for (let i = prevValue; i < newValue; i++) {
                    cols[i] = cols[i + 1];
                }
                cols[newValue] = movedCol;
            }
            else {
                const movedCol = cols[prevValue];
                for (let i = prevValue; i > newValue; i--) {
                    cols[i] = cols[i - 1];
                }
                cols[newValue] = movedCol;
            }
        }
        this._internalColumns = cols;
        this.reorder.emit(event);
    }
    /**
     * The header triggered a column sort event.
     */
    onColumnSort(event) {
        // clean selected rows
        if (this.selectAllRowsOnPage) {
            this.selected = [];
            this.select.emit({
                selected: this.selected
            });
        }
        this.sorts = event.sorts;
        // this could be optimized better since it will resort
        // the rows again on the 'push' detection...
        if (this.externalSorting === false) {
            // don't use normal setter so we don't resort
            this.sortInternalRows();
        }
        // auto group by parent on new update
        this._internalRows = groupRowsByParents(this._internalRows, optionalGetterForProp(this.treeFromRelation), optionalGetterForProp(this.treeToRelation));
        // Always go to first page when sorting to see the newly sorted data
        this.offset = 0;
        this.bodyComponent.updateOffsetY(this.offset);
        // Emit the page object with updated offset value
        this.page.emit({
            count: this.count,
            pageSize: this.pageSize,
            limit: this.limit,
            offset: this.offset,
            sorts: this.sorts
        });
        this.sort.emit(event);
    }
    /**
     * Toggle all row selection
     */
    onHeaderSelect() {
        if (this.bodyComponent && this.selectAllRowsOnPage) {
            // before we splice, chk if we currently have all selected
            const first = this.bodyComponent.indexes().first;
            const last = this.bodyComponent.indexes().last;
            const allSelected = this.selected.length === last - first;
            // remove all existing either way
            this.selected = [];
            // do the opposite here
            if (!allSelected) {
                this.selected.push(...this._internalRows.slice(first, last).filter(row => !!row));
            }
        }
        else {
            let relevantRows;
            if (this.disableRowCheck) {
                relevantRows = this.rows.filter((row => row && !this.disableRowCheck(row)));
            }
            else {
                relevantRows = this.rows.filter(row => !!row);
            }
            // before we splice, chk if we currently have all selected
            const allSelected = this.selected.length === relevantRows.length;
            // remove all existing either way
            this.selected = [];
            // do the opposite here
            if (!allSelected) {
                this.selected.push(...relevantRows);
            }
        }
        this.select.emit({
            selected: this.selected
        });
    }
    /**
     * A row was selected from body
     */
    onBodySelect(event) {
        this.select.emit(event);
    }
    /**
     * A row was expanded or collapsed for tree
     */
    onTreeAction(event) {
        const row = event.row;
        // TODO: For duplicated items this will not work
        const rowIndex = this._rows.findIndex(r => r && r[this.treeToRelation] === event.row[this.treeToRelation]);
        this.treeAction.emit({ row, rowIndex });
    }
    ngOnDestroy() {
        this._subscriptions.forEach(subscription => subscription.unsubscribe());
    }
    /**
     * listen for changes to input bindings of all DataTableColumnDirective and
     * trigger the columnTemplates.changes observable to emit
     */
    listenForColumnInputChanges() {
        this._subscriptions.push(this.columnChangesService.columnInputChanges$.subscribe(() => {
            if (this.columnTemplates) {
                this.columnTemplates.notifyOnChanges();
            }
        }));
    }
    sortInternalRows() {
        // if there are no sort criteria we reset the rows with original rows
        if (!this.sorts || !this.sorts?.length) {
            this._internalRows = this._rows;
            // if there is any tree relation then re-group rows accordingly
            if (this.treeFromRelation && this.treeToRelation) {
                this._internalRows = groupRowsByParents(this._internalRows, optionalGetterForProp(this.treeFromRelation), optionalGetterForProp(this.treeToRelation));
            }
        }
        if (this.groupedRows && this.groupedRows.length) {
            const sortOnGroupHeader = this.sorts?.find(sortColumns => sortColumns.prop === this._groupRowsBy);
            this.groupedRows = this.groupArrayBy(this._rows, this._groupRowsBy);
            this.groupedRows = sortGroupedRows(this.groupedRows, this._internalColumns, this.sorts, sortOnGroupHeader);
            this._internalRows = [...this._internalRows];
        }
        else {
            this._internalRows = sortRows(this._internalRows, this._internalColumns, this.sorts);
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "20.0.5", type: DatatableComponent, isStandalone: true, selector: "ngx-datatable", inputs: { targetMarkerTemplate: "targetMarkerTemplate", rows: "rows", groupRowsBy: "groupRowsBy", groupedRows: "groupedRows", columns: "columns", selected: "selected", scrollbarV: ["scrollbarV", "scrollbarV", booleanAttribute], scrollbarVDynamic: ["scrollbarVDynamic", "scrollbarVDynamic", booleanAttribute], scrollbarH: ["scrollbarH", "scrollbarH", booleanAttribute], rowHeight: "rowHeight", columnMode: "columnMode", headerHeight: ["headerHeight", "headerHeight", numberAttribute], footerHeight: ["footerHeight", "footerHeight", numberAttribute], externalPaging: ["externalPaging", "externalPaging", booleanAttribute], externalSorting: ["externalSorting", "externalSorting", booleanAttribute], limit: ["limit", "limit", numberAttribute], count: ["count", "count", numberAttribute], offset: ["offset", "offset", numberAttribute], loadingIndicator: ["loadingIndicator", "loadingIndicator", booleanAttribute], ghostLoadingIndicator: ["ghostLoadingIndicator", "ghostLoadingIndicator", booleanAttribute], selectionType: "selectionType", reorderable: ["reorderable", "reorderable", booleanAttribute], swapColumns: ["swapColumns", "swapColumns", booleanAttribute], sortType: "sortType", sorts: "sorts", cssClasses: "cssClasses", messages: "messages", rowClass: "rowClass", selectCheck: "selectCheck", displayCheck: "displayCheck", groupExpansionDefault: ["groupExpansionDefault", "groupExpansionDefault", booleanAttribute], trackByProp: "trackByProp", selectAllRowsOnPage: ["selectAllRowsOnPage", "selectAllRowsOnPage", booleanAttribute], virtualization: ["virtualization", "virtualization", booleanAttribute], treeFromRelation: "treeFromRelation", treeToRelation: "treeToRelation", summaryRow: ["summaryRow", "summaryRow", booleanAttribute], summaryHeight: ["summaryHeight", "summaryHeight", numberAttribute], summaryPosition: "summaryPosition", disableRowCheck: "disableRowCheck", rowDraggable: ["rowDraggable", "rowDraggable", booleanAttribute], enableClearingSortState: ["enableClearingSortState", "enableClearingSortState", booleanAttribute], rowIdentity: "rowIdentity" }, outputs: { scroll: "scroll", activate: "activate", select: "select", sort: "sort", page: "page", reorder: "reorder", resize: "resize", tableContextmenu: "tableContextmenu", treeAction: "treeAction", rowDragEvents: "rowDragEvents" }, host: { listeners: { "window:resize": "onWindowResize()" }, properties: { "class.fixed-header": "this.isFixedHeader", "class.fixed-row": "this.isFixedRow", "class.scroll-vertical": "this.isVertScroll", "class.virtualized": "this.isVirtualized", "class.scroll-horz": "this.isHorScroll", "class.selectable": "this.isSelectable", "class.checkbox-selection": "this.isCheckboxSelection", "class.cell-selection": "this.isCellSelection", "class.single-selection": "this.isSingleSelection", "class.multi-selection": "this.isMultiSelection", "class.multi-click-selection": "this.isMultiClickSelection" }, classAttribute: "ngx-datatable" }, providers: [
            {
                provide: DatatableComponentToken,
                useExisting: DatatableComponent
            },
            ColumnChangesService
        ], queries: [{ propertyName: "rowDetail", first: true, predicate: DatatableRowDetailDirective, descendants: true }, { propertyName: "groupHeader", first: true, predicate: DatatableGroupHeaderDirective, descendants: true }, { propertyName: "footer", first: true, predicate: DatatableFooterDirective, descendants: true }, { propertyName: "rowDefTemplate", first: true, predicate: DatatableRowDefDirective, descendants: true, read: TemplateRef }, { propertyName: "columnTemplates", predicate: DataTableColumnDirective }], viewQueries: [{ propertyName: "bodyComponent", first: true, predicate: DataTableBodyComponent, descendants: true }, { propertyName: "headerComponent", first: true, predicate: DataTableHeaderComponent, descendants: true }, { propertyName: "bodyElement", first: true, predicate: DataTableBodyComponent, descendants: true, read: ElementRef }], ngImport: i0, template: "<div visibilityObserver (visible)=\"recalculate()\">\n  <div role=\"table\">\n    @if (headerHeight) {\n    <datatable-header\n      role=\"rowgroup\"\n      [sorts]=\"sorts\"\n      [sortType]=\"sortType\"\n      [scrollbarH]=\"scrollbarH\"\n      [innerWidth]=\"_innerWidth\"\n      [offsetX]=\"_offsetX\"\n      [dealsWithGroup]=\"groupedRows !== undefined\"\n      [columns]=\"_internalColumns\"\n      [headerHeight]=\"headerHeight\"\n      [reorderable]=\"reorderable\"\n      [targetMarkerTemplate]=\"targetMarkerTemplate\"\n      [sortAscendingIcon]=\"cssClasses.sortAscending\"\n      [sortDescendingIcon]=\"cssClasses.sortDescending\"\n      [sortUnsetIcon]=\"cssClasses.sortUnset\"\n      [allRowsSelected]=\"allRowsSelected\"\n      [selectionType]=\"selectionType\"\n      [verticalScrollVisible]=\"verticalScrollVisible\"\n      [enableClearingSortState]=\"enableClearingSortState\"\n      (sort)=\"onColumnSort($event)\"\n      (resize)=\"onColumnResize($event)\"\n      (resizing)=\"onColumnResizing($event)\"\n      (reorder)=\"onColumnReorder($event)\"\n      (select)=\"onHeaderSelect()\"\n      (columnContextmenu)=\"onColumnContextmenu($event)\"\n    >\n    </datatable-header>\n    }\n    <datatable-body\n      tabindex=\"0\"\n      role=\"rowgroup\"\n      [groupRowsBy]=\"groupRowsBy\"\n      [groupedRows]=\"groupedRows\"\n      [rows]=\"_internalRows\"\n      [groupExpansionDefault]=\"groupExpansionDefault\"\n      [scrollbarV]=\"scrollbarV\"\n      [scrollbarH]=\"scrollbarH\"\n      [virtualization]=\"virtualization\"\n      [loadingIndicator]=\"loadingIndicator\"\n      [ghostLoadingIndicator]=\"ghostLoadingIndicator\"\n      [externalPaging]=\"externalPaging\"\n      [rowHeight]=\"rowHeight\"\n      [rowCount]=\"rowCount\"\n      [offset]=\"offset\"\n      [trackByProp]=\"trackByProp\"\n      [columns]=\"_internalColumns\"\n      [pageSize]=\"pageSize\"\n      [offsetX]=\"_offsetX\"\n      [rowDetail]=\"rowDetail\"\n      [groupHeader]=\"groupHeader\"\n      [selected]=\"selected\"\n      [innerWidth]=\"_innerWidth\"\n      [bodyHeight]=\"bodyHeight\"\n      [selectionType]=\"selectionType\"\n      [rowIdentity]=\"rowIdentity\"\n      [rowClass]=\"rowClass\"\n      [selectCheck]=\"selectCheck\"\n      [displayCheck]=\"displayCheck\"\n      [summaryRow]=\"summaryRow\"\n      [summaryHeight]=\"summaryHeight\"\n      [summaryPosition]=\"summaryPosition\"\n      [verticalScrollVisible]=\"verticalScrollVisible\"\n      (page)=\"onBodyPage($event)\"\n      (activate)=\"activate.emit($event)\"\n      (rowContextmenu)=\"onRowContextmenu($event)\"\n      (select)=\"onBodySelect($event)\"\n      (scroll)=\"onBodyScroll($event)\"\n      (treeAction)=\"onTreeAction($event)\"\n      [disableRowCheck]=\"disableRowCheck\"\n      [rowDraggable]=\"rowDraggable\"\n      [rowDragEvents]=\"rowDragEvents\"\n      [rowDefTemplate]=\"rowDefTemplate\"\n    >\n      <ng-content select=\"[loading-indicator]\" ngProjectAs=\"[loading-indicator]\">\n        <datatable-progress></datatable-progress>\n      </ng-content>\n      <ng-content select=\"[empty-content]\" ngProjectAs=\"[empty-content]\">\n        <div role=\"row\">\n          <div\n            role=\"cell\"\n            class=\"empty-row\"\n            [innerHTML]=\"messages.emptyMessage ?? 'No data to display'\"\n          ></div>\n        </div>\n      </ng-content>\n    </datatable-body>\n  </div>\n  @if (footerHeight) {\n  <datatable-footer\n    [rowCount]=\"groupedRows !== undefined ? _internalRows.length : rowCount\"\n    [pageSize]=\"pageSize\"\n    [offset]=\"offset\"\n    [footerHeight]=\"footerHeight\"\n    [footerTemplate]=\"footer\"\n    [totalMessage]=\"messages.totalMessage ?? 'total'\"\n    [pagerLeftArrowIcon]=\"cssClasses.pagerLeftArrow\"\n    [pagerRightArrowIcon]=\"cssClasses.pagerRightArrow\"\n    [pagerPreviousIcon]=\"cssClasses.pagerPrevious\"\n    [selectedCount]=\"selected.length\"\n    [selectedMessage]=\"!!selectionType && (messages.selectedMessage ?? 'selected')\"\n    [pagerNextIcon]=\"cssClasses.pagerNext\"\n    (page)=\"onFooterPage($event)\"\n  >\n  </datatable-footer>\n  }\n</div>\n", styles: [":host{display:block;overflow:hidden;justify-content:center;position:relative;transform:translateZ(0)}\n"], dependencies: [{ kind: "directive", type: VisibilityDirective, selector: "[visibilityObserver]", outputs: ["visible"] }, { kind: "component", type: DataTableHeaderComponent, selector: "datatable-header", inputs: ["sortAscendingIcon", "sortDescendingIcon", "sortUnsetIcon", "scrollbarH", "dealsWithGroup", "targetMarkerTemplate", "enableClearingSortState", "innerWidth", "sorts", "sortType", "allRowsSelected", "selectionType", "reorderable", "verticalScrollVisible", "headerHeight", "columns", "offsetX"], outputs: ["sort", "reorder", "resize", "resizing", "select", "columnContextmenu"] }, { kind: "component", type: DataTableBodyComponent, selector: "datatable-body", inputs: ["rowDefTemplate", "scrollbarV", "scrollbarH", "loadingIndicator", "ghostLoadingIndicator", "externalPaging", "rowHeight", "offsetX", "selectionType", "selected", "rowIdentity", "rowDetail", "groupHeader", "selectCheck", "displayCheck", "trackByProp", "rowClass", "groupedRows", "groupExpansionDefault", "innerWidth", "groupRowsBy", "virtualization", "summaryRow", "summaryPosition", "summaryHeight", "rowDraggable", "rowDragEvents", "disableRowCheck", "pageSize", "rows", "columns", "offset", "rowCount", "bodyHeight", "verticalScrollVisible"], outputs: ["scroll", "page", "activate", "select", "rowContextmenu", "treeAction"] }, { kind: "component", type: DataTableFooterComponent, selector: "datatable-footer", inputs: ["footerHeight", "rowCount", "pageSize", "offset", "pagerLeftArrowIcon", "pagerRightArrowIcon", "pagerPreviousIcon", "pagerNextIcon", "totalMessage", "footerTemplate", "selectedCount", "selectedMessage"], outputs: ["page"] }, { kind: "component", type: ProgressBarComponent, selector: "datatable-progress" }], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
__decorate([
    throttleable(5)
], DatatableComponent.prototype, "onWindowResize", null);
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DatatableComponent, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-datatable', changeDetection: ChangeDetectionStrategy.OnPush, host: {
                        class: 'ngx-datatable'
                    }, providers: [
                        {
                            provide: DatatableComponentToken,
                            useExisting: DatatableComponent
                        },
                        ColumnChangesService
                    ], imports: [
                        VisibilityDirective,
                        DataTableHeaderComponent,
                        DataTableBodyComponent,
                        DataTableFooterComponent,
                        ProgressBarComponent
                    ], template: "<div visibilityObserver (visible)=\"recalculate()\">\n  <div role=\"table\">\n    @if (headerHeight) {\n    <datatable-header\n      role=\"rowgroup\"\n      [sorts]=\"sorts\"\n      [sortType]=\"sortType\"\n      [scrollbarH]=\"scrollbarH\"\n      [innerWidth]=\"_innerWidth\"\n      [offsetX]=\"_offsetX\"\n      [dealsWithGroup]=\"groupedRows !== undefined\"\n      [columns]=\"_internalColumns\"\n      [headerHeight]=\"headerHeight\"\n      [reorderable]=\"reorderable\"\n      [targetMarkerTemplate]=\"targetMarkerTemplate\"\n      [sortAscendingIcon]=\"cssClasses.sortAscending\"\n      [sortDescendingIcon]=\"cssClasses.sortDescending\"\n      [sortUnsetIcon]=\"cssClasses.sortUnset\"\n      [allRowsSelected]=\"allRowsSelected\"\n      [selectionType]=\"selectionType\"\n      [verticalScrollVisible]=\"verticalScrollVisible\"\n      [enableClearingSortState]=\"enableClearingSortState\"\n      (sort)=\"onColumnSort($event)\"\n      (resize)=\"onColumnResize($event)\"\n      (resizing)=\"onColumnResizing($event)\"\n      (reorder)=\"onColumnReorder($event)\"\n      (select)=\"onHeaderSelect()\"\n      (columnContextmenu)=\"onColumnContextmenu($event)\"\n    >\n    </datatable-header>\n    }\n    <datatable-body\n      tabindex=\"0\"\n      role=\"rowgroup\"\n      [groupRowsBy]=\"groupRowsBy\"\n      [groupedRows]=\"groupedRows\"\n      [rows]=\"_internalRows\"\n      [groupExpansionDefault]=\"groupExpansionDefault\"\n      [scrollbarV]=\"scrollbarV\"\n      [scrollbarH]=\"scrollbarH\"\n      [virtualization]=\"virtualization\"\n      [loadingIndicator]=\"loadingIndicator\"\n      [ghostLoadingIndicator]=\"ghostLoadingIndicator\"\n      [externalPaging]=\"externalPaging\"\n      [rowHeight]=\"rowHeight\"\n      [rowCount]=\"rowCount\"\n      [offset]=\"offset\"\n      [trackByProp]=\"trackByProp\"\n      [columns]=\"_internalColumns\"\n      [pageSize]=\"pageSize\"\n      [offsetX]=\"_offsetX\"\n      [rowDetail]=\"rowDetail\"\n      [groupHeader]=\"groupHeader\"\n      [selected]=\"selected\"\n      [innerWidth]=\"_innerWidth\"\n      [bodyHeight]=\"bodyHeight\"\n      [selectionType]=\"selectionType\"\n      [rowIdentity]=\"rowIdentity\"\n      [rowClass]=\"rowClass\"\n      [selectCheck]=\"selectCheck\"\n      [displayCheck]=\"displayCheck\"\n      [summaryRow]=\"summaryRow\"\n      [summaryHeight]=\"summaryHeight\"\n      [summaryPosition]=\"summaryPosition\"\n      [verticalScrollVisible]=\"verticalScrollVisible\"\n      (page)=\"onBodyPage($event)\"\n      (activate)=\"activate.emit($event)\"\n      (rowContextmenu)=\"onRowContextmenu($event)\"\n      (select)=\"onBodySelect($event)\"\n      (scroll)=\"onBodyScroll($event)\"\n      (treeAction)=\"onTreeAction($event)\"\n      [disableRowCheck]=\"disableRowCheck\"\n      [rowDraggable]=\"rowDraggable\"\n      [rowDragEvents]=\"rowDragEvents\"\n      [rowDefTemplate]=\"rowDefTemplate\"\n    >\n      <ng-content select=\"[loading-indicator]\" ngProjectAs=\"[loading-indicator]\">\n        <datatable-progress></datatable-progress>\n      </ng-content>\n      <ng-content select=\"[empty-content]\" ngProjectAs=\"[empty-content]\">\n        <div role=\"row\">\n          <div\n            role=\"cell\"\n            class=\"empty-row\"\n            [innerHTML]=\"messages.emptyMessage ?? 'No data to display'\"\n          ></div>\n        </div>\n      </ng-content>\n    </datatable-body>\n  </div>\n  @if (footerHeight) {\n  <datatable-footer\n    [rowCount]=\"groupedRows !== undefined ? _internalRows.length : rowCount\"\n    [pageSize]=\"pageSize\"\n    [offset]=\"offset\"\n    [footerHeight]=\"footerHeight\"\n    [footerTemplate]=\"footer\"\n    [totalMessage]=\"messages.totalMessage ?? 'total'\"\n    [pagerLeftArrowIcon]=\"cssClasses.pagerLeftArrow\"\n    [pagerRightArrowIcon]=\"cssClasses.pagerRightArrow\"\n    [pagerPreviousIcon]=\"cssClasses.pagerPrevious\"\n    [selectedCount]=\"selected.length\"\n    [selectedMessage]=\"!!selectionType && (messages.selectedMessage ?? 'selected')\"\n    [pagerNextIcon]=\"cssClasses.pagerNext\"\n    (page)=\"onFooterPage($event)\"\n  >\n  </datatable-footer>\n  }\n</div>\n", styles: [":host{display:block;overflow:hidden;justify-content:center;position:relative;transform:translateZ(0)}\n"] }]
        }], ctorParameters: () => [], propDecorators: { targetMarkerTemplate: [{
                type: Input
            }], rows: [{
                type: Input
            }], groupRowsBy: [{
                type: Input
            }], groupedRows: [{
                type: Input
            }], columns: [{
                type: Input
            }], selected: [{
                type: Input
            }], scrollbarV: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], scrollbarVDynamic: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], scrollbarH: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], rowHeight: [{
                type: Input
            }], columnMode: [{
                type: Input
            }], headerHeight: [{
                type: Input,
                args: [{ transform: numberAttribute }]
            }], footerHeight: [{
                type: Input,
                args: [{ transform: numberAttribute }]
            }], externalPaging: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], externalSorting: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], limit: [{
                type: Input,
                args: [{ transform: numberAttribute }]
            }], count: [{
                type: Input,
                args: [{ transform: numberAttribute }]
            }], offset: [{
                type: Input,
                args: [{ transform: numberAttribute }]
            }], loadingIndicator: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], ghostLoadingIndicator: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], selectionType: [{
                type: Input
            }], reorderable: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], swapColumns: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], sortType: [{
                type: Input
            }], sorts: [{
                type: Input
            }], cssClasses: [{
                type: Input
            }], messages: [{
                type: Input
            }], rowClass: [{
                type: Input
            }], selectCheck: [{
                type: Input
            }], displayCheck: [{
                type: Input
            }], groupExpansionDefault: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], trackByProp: [{
                type: Input
            }], selectAllRowsOnPage: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], virtualization: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], treeFromRelation: [{
                type: Input
            }], treeToRelation: [{
                type: Input
            }], summaryRow: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], summaryHeight: [{
                type: Input,
                args: [{ transform: numberAttribute }]
            }], summaryPosition: [{
                type: Input
            }], disableRowCheck: [{
                type: Input
            }], rowDraggable: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], enableClearingSortState: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], scroll: [{
                type: Output
            }], activate: [{
                type: Output
            }], select: [{
                type: Output
            }], sort: [{
                type: Output
            }], page: [{
                type: Output
            }], reorder: [{
                type: Output
            }], resize: [{
                type: Output
            }], tableContextmenu: [{
                type: Output
            }], treeAction: [{
                type: Output
            }], rowDragEvents: [{
                type: Output
            }], isFixedHeader: [{
                type: HostBinding,
                args: ['class.fixed-header']
            }], isFixedRow: [{
                type: HostBinding,
                args: ['class.fixed-row']
            }], isVertScroll: [{
                type: HostBinding,
                args: ['class.scroll-vertical']
            }], isVirtualized: [{
                type: HostBinding,
                args: ['class.virtualized']
            }], isHorScroll: [{
                type: HostBinding,
                args: ['class.scroll-horz']
            }], isSelectable: [{
                type: HostBinding,
                args: ['class.selectable']
            }], isCheckboxSelection: [{
                type: HostBinding,
                args: ['class.checkbox-selection']
            }], isCellSelection: [{
                type: HostBinding,
                args: ['class.cell-selection']
            }], isSingleSelection: [{
                type: HostBinding,
                args: ['class.single-selection']
            }], isMultiSelection: [{
                type: HostBinding,
                args: ['class.multi-selection']
            }], isMultiClickSelection: [{
                type: HostBinding,
                args: ['class.multi-click-selection']
            }], columnTemplates: [{
                type: ContentChildren,
                args: [DataTableColumnDirective]
            }], rowDetail: [{
                type: ContentChild,
                args: [DatatableRowDetailDirective]
            }], groupHeader: [{
                type: ContentChild,
                args: [DatatableGroupHeaderDirective]
            }], footer: [{
                type: ContentChild,
                args: [DatatableFooterDirective]
            }], bodyComponent: [{
                type: ViewChild,
                args: [DataTableBodyComponent]
            }], headerComponent: [{
                type: ViewChild,
                args: [DataTableHeaderComponent]
            }], bodyElement: [{
                type: ViewChild,
                args: [DataTableBodyComponent, { read: ElementRef }]
            }], rowDefTemplate: [{
                type: ContentChild,
                args: [DatatableRowDefDirective, {
                        read: TemplateRef
                    }]
            }], rowIdentity: [{
                type: Input
            }], onWindowResize: [{
                type: HostListener,
                args: ['window:resize']
            }] } });

/**
 * Row Disable Directive
 * Use this to disable/enable all children elements
 * Usage:
 *  To disable
 * 		<div [disabled]="true" disable-row >
 * 		</div>
 *  To enable
 *  	<div [disabled]="false" disable-row >
 * 		</div>
 */
class DisableRowDirective {
    constructor() {
        this.elementRef = inject(ElementRef);
        this.disabled = input(false, {
            transform: booleanAttribute
        });
        effect(() => {
            if (this.disabled()) {
                this.disableAllElements();
            }
        });
    }
    disableAllElements() {
        const hostElement = this.elementRef?.nativeElement;
        if (!hostElement) {
            return;
        }
        Array.from(hostElement.querySelectorAll('*')).forEach(child => {
            child.setAttribute('disabled', '');
        });
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DisableRowDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "17.1.0", version: "20.0.5", type: DisableRowDirective, isStandalone: true, selector: "[disable-row]", inputs: { disabled: { classPropertyName: "disabled", publicName: "disabled", isSignal: true, isRequired: false, transformFunction: null } }, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: DisableRowDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[disable-row]'
                }]
        }], ctorParameters: () => [] });

class NgxDatatableModule {
    /**
     * Configure global configuration via INgxDatatableConfig
     * @param configuration
     */
    static forRoot(configuration) {
        return {
            ngModule: NgxDatatableModule,
            providers: [providedNgxDatatableConfig(configuration)]
        };
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: NgxDatatableModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "20.0.5", ngImport: i0, type: NgxDatatableModule, imports: [DataTableFooterTemplateDirective,
            DatatableComponent,
            DataTableColumnDirective,
            DatatableRowDetailDirective,
            DatatableGroupHeaderDirective,
            DatatableRowDetailTemplateDirective,
            DataTableColumnHeaderDirective,
            DataTableColumnCellDirective,
            DataTableColumnGhostCellDirective,
            DataTableColumnCellTreeToggle,
            DatatableFooterDirective,
            DatatableGroupHeaderTemplateDirective,
            DisableRowDirective,
            DatatableRowDefComponent,
            DatatableRowDefDirective], exports: [DatatableComponent,
            DatatableRowDetailDirective,
            DatatableGroupHeaderDirective,
            DatatableRowDetailTemplateDirective,
            DataTableColumnDirective,
            DataTableColumnHeaderDirective,
            DataTableColumnCellDirective,
            DataTableColumnGhostCellDirective,
            DataTableColumnCellTreeToggle,
            DataTableFooterTemplateDirective,
            DatatableFooterDirective,
            DatatableGroupHeaderTemplateDirective,
            DisableRowDirective,
            DatatableRowDefComponent,
            DatatableRowDefDirective] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: NgxDatatableModule }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.5", ngImport: i0, type: NgxDatatableModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [
                        DataTableFooterTemplateDirective,
                        DatatableComponent,
                        DataTableColumnDirective,
                        DatatableRowDetailDirective,
                        DatatableGroupHeaderDirective,
                        DatatableRowDetailTemplateDirective,
                        DataTableColumnHeaderDirective,
                        DataTableColumnCellDirective,
                        DataTableColumnGhostCellDirective,
                        DataTableColumnCellTreeToggle,
                        DatatableFooterDirective,
                        DatatableGroupHeaderTemplateDirective,
                        DisableRowDirective,
                        DatatableRowDefComponent,
                        DatatableRowDefDirective
                    ],
                    exports: [
                        DatatableComponent,
                        DatatableRowDetailDirective,
                        DatatableGroupHeaderDirective,
                        DatatableRowDetailTemplateDirective,
                        DataTableColumnDirective,
                        DataTableColumnHeaderDirective,
                        DataTableColumnCellDirective,
                        DataTableColumnGhostCellDirective,
                        DataTableColumnCellTreeToggle,
                        DataTableFooterTemplateDirective,
                        DatatableFooterDirective,
                        DatatableGroupHeaderTemplateDirective,
                        DisableRowDirective,
                        DatatableRowDefComponent,
                        DatatableRowDefDirective
                    ]
                }]
        }] });

/*
 * Public API Surface of ngx-datatable
 */
// components

/**
 * Generated bundle index. Do not edit.
 */

export { ColumnChangesService, ColumnMode, ContextmenuType, DataTableColumnCellDirective, DataTableColumnCellTreeToggle, DataTableColumnDirective, DataTableColumnGhostCellDirective, DataTableColumnHeaderDirective, DataTableFooterTemplateDirective, DatatableComponent, DatatableFooterDirective, DatatableGroupHeaderDirective, DatatableGroupHeaderTemplateDirective, DatatableRowDefComponent, DatatableRowDefDirective, DatatableRowDefInternalDirective, DatatableRowDetailDirective, DatatableRowDetailTemplateDirective, DisableRowDirective, NgxDatatableModule, SelectionType, SortDirection, SortType, isNullOrUndefined, providedNgxDatatableConfig, toInternalColumn };
//# sourceMappingURL=swimlane-ngx-datatable.mjs.map
