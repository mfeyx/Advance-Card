/**
 *
 * Create all the DOM Elements for Advance Card
 *
 */

"use strict";

let version = "2.0.1";
let helpUrl = "https://github.com/bhavesh-jadav/Advance-Card/wiki";

import "./../style/visual.less";
import {
    valueFormatter,
    textMeasurementService,
    stringExtensions as StringExtensions,
    displayUnitSystemType
} from "powerbi-visuals-utils-formattingutils";
import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";
import {
    AdvanceCardVisualSettings, FixLabelSettings, DataLabelSettings, CategoryLabelSettings,
    FillSettings, StrokeSettings, ConditionSettings, TooltipSettings, GeneralSettings
} from "./settings";
import { Selection, BaseType, select, mouse } from "d3-selection";
import { valueType } from "powerbi-visuals-utils-typeutils";
import { manipulation } from "powerbi-visuals-utils-svgutils";
import { LabelExist, CreateLabelElement, UpdateLabelValue, UpdateLabelStyles, GetLabelSize } from "./AdvanceCardUtils";

import powerbi from "powerbi-visuals-api";
import Translate = manipulation.translate;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import ValueType = valueType.ValueType;
import ExtendedType = valueType.ExtendedType;
import ValueFormatter = valueFormatter.valueFormatter;
import TextMeasurementService = textMeasurementService.textMeasurementService;
import TextProperties = textMeasurementService.TextProperties;
import DisplayUnitSystemType = displayUnitSystemType.DisplayUnitSystemType;

enum AdvanceCardClassNames {
    SVGClass= "root-svg",
    DataLabelClass = "data-label",
    CategoryLabelClass = "category-label",
    PrefixLabelClass = "prefix-label",
    PostfixLabelClass = "postfix-label"
}

export class AdvanceCard {

    private rootSVGElement: Selection<BaseType, any, any, any>;
    private dataLabelGroupElement: Selection<BaseType, any, any, any>;
    private categoryLabelGroupElement: Selection<BaseType, any, any, any>;
    private prefixLabelGroupElement: Selection<BaseType, any, any, any>;
    private rootSVGSize: DOMRect | ClientRect;

    constructor(private target: HTMLElement) {
        try {
            this.rootSVGElement = select(this.target).append("svg")
                .classed(AdvanceCardClassNames.SVGClass, true);
        } catch (err) {
            throw err;
        }
    }

    /**
     * Set the size of the Advance Card
     *
     * @param {number} width generally the width of the viewport
     * @param {number} height generally the height of the viewport
     * @memberof AdvanceCard
     */
    public SetSize(width: number, height: number) {
        this.rootSVGElement.attr("width", width)
            .attr("height", height);

        this.rootSVGSize = (this.rootSVGElement.node() as HTMLElement).getBoundingClientRect();
    }

    public UpdateDataLabelValue (value: string) {
        UpdateLabelValue(this.dataLabelGroupElement, value);
    }

    public UpdateDataLabelTextStyle(dataLabelSettings: DataLabelSettings) {
        UpdateLabelStyles(this.dataLabelGroupElement, dataLabelSettings);
    }

    public UpdateDataLabelColor(color: string) {
        this.dataLabelGroupElement.select("text")
            .style("fill", color);
    }

    public UpdateDataLabelTransform(settings: AdvanceCardVisualSettings) {
        let dataLabelTextElement: Selection<BaseType, any, any, any> = this.dataLabelGroupElement.select("text");
        let x: number;
        let y = this.GetYForTopRow(settings.categoryLabelSettings.show);

        if (settings.general.alignment === "right") {
            x = this.rootSVGSize.width - settings.general.alignmentSpacing;
            dataLabelTextElement.attr("text-anchor", "end");
        }
        else if (settings.prefixSettings.show && this.PrefixLabelExist()) {
            let prefixLabelSize = GetLabelSize(this.prefixLabelGroupElement);
            let dataLabelSize = GetLabelSize(this.dataLabelGroupElement);
            if (settings.general.alignment === "center") {
                let totalWidth = prefixLabelSize.width + dataLabelSize.width + settings.prefixSettings.spacing;
                x = this.rootSVGSize.width / 2 - totalWidth / 2 + prefixLabelSize.width + settings.prefixSettings.spacing;
                dataLabelTextElement.attr("text-anchor", "start");
            } else if (settings.general.alignment === "left") {
                x = settings.general.alignmentSpacing + prefixLabelSize.width + settings.prefixSettings.spacing;
                dataLabelTextElement.attr("text-anchor", "start");
            }
        } else if (settings.general.alignment === "center") {
            x = this.rootSVGSize.width / 2;
            dataLabelTextElement.attr("text-anchor", "middle");
        } else if (settings.general.alignment === "left") {
            x = settings.general.alignmentSpacing;
            dataLabelTextElement.attr("text-anchor", "start");
        }
        dataLabelTextElement.attr("x", x).attr("y", y);
    }

    public UpdatePrefixLabelTransform(settings: AdvanceCardVisualSettings) {
        let prefixLabelTextElement: Selection<BaseType, any, any, any> = this.prefixLabelGroupElement.select("text");
        let x: number;

        let y = this.GetYForTopRow(settings.categoryLabelSettings.show);

        let prefixLabelSize = GetLabelSize(this.prefixLabelGroupElement);
        let dataLabelSize = GetLabelSize(this.dataLabelGroupElement);
        if (settings.general.alignment === "center") {
            let totalWidth = prefixLabelSize.width + dataLabelSize.width + settings.prefixSettings.spacing;
            x = this.rootSVGSize.width / 2 - totalWidth / 2;
            prefixLabelTextElement.attr("text-anchor", "start");
        } else if (settings.general.alignment === "left") {
            x = settings.general.alignmentSpacing;
        } else if (settings.general.alignment === "right") {
            let dataLabelSize = GetLabelSize(this.dataLabelGroupElement);
            x = this.rootSVGSize.width - settings.general.alignmentSpacing - dataLabelSize.width - settings.prefixSettings.spacing;
            prefixLabelTextElement.attr("text-anchor", "end");
        }
        prefixLabelTextElement.attr("x", x).attr("y", y);
    }

    public UpdateCategoryLabelTransform(settings: AdvanceCardVisualSettings) {
        let categoryLabelElement: Selection<BaseType, any, any, any> = this.categoryLabelGroupElement.select("text");
        let x: number;
        let dataLabelCategoryLabelSpacing = 5;
        let categoryLabelSize = GetLabelSize(this.categoryLabelGroupElement);

        let y = this.rootSVGSize.height / 2 + categoryLabelSize.height / 2 + dataLabelCategoryLabelSpacing / 2;

        if (settings.general.alignment === "center") {
            x = this.rootSVGSize.width / 2;
            categoryLabelElement.attr("text-anchor", "middle");
        } else if (settings.general.alignment === "left") {
            x = settings.general.alignmentSpacing;
            categoryLabelElement.attr("text-anchor", "start");
        } else if (settings.general.alignment === "right") {
            x = this.rootSVGSize.width - settings.general.alignmentSpacing;
            categoryLabelElement.attr("text-anchor", "end");
        }
        categoryLabelElement.attr("x", x).attr("y", y);
    }

    public GetYForTopRow(showCategoryLabel: boolean) {
        let y: number;
        if (showCategoryLabel) {
            let dataLabelCategoryLabelSpacing = 5;
            let dataLabelSize = GetLabelSize(this.dataLabelGroupElement);
            y = this.rootSVGSize.height / 2 - dataLabelSize.height / 2 - dataLabelCategoryLabelSpacing / 2;
        } else {
            y = this.rootSVGSize.height / 2;
        }
        return y;
    }

    public RemoveDataLabel() {
        this.dataLabelGroupElement.remove();
        this.dataLabelGroupElement = undefined;
    }

    public RemovePrefixLabel() {
        this.prefixLabelGroupElement.remove();
        this.prefixLabelGroupElement = undefined;
    }

    public RemoveCategoryLabel() {
        this.categoryLabelGroupElement.remove();
        this.categoryLabelGroupElement = undefined;
    }

    public UpdateCategoryLabelValue(value: string) {
        UpdateLabelValue(this.categoryLabelGroupElement, value);
    }

    public UpdatePrefixLabelValue(value: string) {
        UpdateLabelValue(this.prefixLabelGroupElement, value);
    }

    public UpdateCategoryLabelStyles(categoryLabelSettings: CategoryLabelSettings) {
        UpdateLabelStyles(this.categoryLabelGroupElement, categoryLabelSettings);
    }

    public UpdatePrefixLabelStyles(prefixLabelSettings: FixLabelSettings) {
        UpdateLabelStyles(this.prefixLabelGroupElement, prefixLabelSettings);
    }

    public DataLabelExist() {
        return LabelExist(this.dataLabelGroupElement);
    }

    public CategoryLabelExist() {
        return LabelExist(this.categoryLabelGroupElement);
    }

    public PrefixLabelExist() {
        return LabelExist(this.prefixLabelGroupElement);
    }

    public CreateDataLabel() {
        this.dataLabelGroupElement = CreateLabelElement(this.rootSVGElement, this.dataLabelGroupElement, AdvanceCardClassNames.DataLabelClass);
    }

    public CreateCategoryLabel() {
        this.categoryLabelGroupElement = CreateLabelElement(this.rootSVGElement, this.categoryLabelGroupElement, AdvanceCardClassNames.CategoryLabelClass);
    }

    public CreatePrefixLabel() {
        this.prefixLabelGroupElement = CreateLabelElement(this.rootSVGElement, this.prefixLabelGroupElement, AdvanceCardClassNames.PrefixLabelClass);
    }
}