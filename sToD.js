(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.SToD = factory());
}(this, (function () {
    'use strict';

    const NodeType = Object.freeze({
        ELEMENT_NODE: 1,
        ATTRIBUTE_NODE: 2,
        TEXT_NODE: 3,
        CDATA_SECTION_NODE: 4,
        ENTITY_REFERENCE_NODE: 5,
        ENTITY_NODE: 6,
        PROCESSING_INSTRUCTION_NODE: 7,
        COMMENT_NODE: 8,
        DOCUMENT_NODE: 9,
        DOCUMENT_TYPE_NODE: 10,
        DOCUMENT_FRAGMENT_NODE: 11,
        NOTATION_NODE: 12
    });

    const Type = Object.freeze({
        OBJ: 'object'
    });

    const ConSD = function (option) {
        const _defaultOption = Object.freeze({
            useId: true,
            classAdd: true,
            templateStrings: true
        });

        this._option = JSON.parse(JSON.stringify(_defaultOption));
        if (!!option && typeof option === Type.OBJ) Object.assign(this._option, option);
    }

    ConSD.prototype.convert = function(htmlString, options) {
        const varSet = new Set();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const elements = doc.body.childNodes;
        const defaultOptions = {
            useId: true,
            classAdd: true,
            templateStrings: true
        }
        if (!options) options = defaultOptions;
        let jsCode = '';

        const getVName = (tag) => {
            let count = 1;
            while (count < 1000) {
                if (!varSet.has(tag + count)) {
                    varSet.add(tag + count);
                    return tag + count;
                }
                count++;
            }
            if (count === 1000) {
                document.querySelector("#result").innerText = "so many same tag names";
            }
        }

        const appendChildNodes = (element, vName) => {
            element.childNodes.forEach((childNode) => {
                if (childNode.nodeType === NodeType.TEXT_NODE) {
                    let nodeText = `${childNode.textContent.trim()}`;
                    if (!nodeText) return;
                    if (options.templateStrings) {
                        jsCode += `textNode = document.createTextNode(\`${nodeText}\`);\n`;
                    } else {
                        nodeText = nodeText.replace(/"/g, '\\"');
                        jsCode += 'textNode = document.createTextNode("' + nodeText + '");\n';
                    }
                    jsCode += `${vName}.appendChild(textNode);\n`;
                } else {
                    const childTag = options.useId && !!childNode.id ? childNode.id : `${childNode.tagName.toLowerCase()}`;
                    const cvName = getVName(childTag);
                    jsCode += createJSForElement(childNode, cvName);
                    jsCode += `${vName}.appendChild(${cvName});\n`;
                    appendChildNodes(childNode, cvName);
                }
            });
        }

        const createJSForElement = (element, varName) => {
            let js = `const ${varName} = document.createElement('${element.tagName.toLowerCase()}');\n`;
            if (element.id) {
                js += `${varName}.id = '${element.id}';\n`;
                element.removeAttribute('id');
            }
            if (element.className) {
                if (options.classAdd === true) {
                    element.classList.forEach((item) => {
                        js += `${varName}.classList.add('${item}');\n`;
                    });
                } else {
                    js += `${varName}.className = '${element.className}';\n`;
                }
                element.removeAttribute('class');
            }
            let attributeNames = element.getAttributeNames();
            attributeNames.forEach((attributeName) => {
                js += `${varName}.setAttribute('${attributeName}', \`${element.getAttribute(attributeName)}\`);\n`;
            });
            return js;
        };

        elements.forEach((element) => {
            const vName = getVName(defaultOptions.useId && !!element.id ? element.id : `${element.tagName.toLowerCase()}`);
            jsCode += createJSForElement(element, vName);
            if (!vName) return;

            appendChildNodes(element, vName);
        });

        return jsCode;
    }

    return ConSD;
})));