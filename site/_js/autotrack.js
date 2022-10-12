/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*! autotrack.js v1.0.1 */
!(function t(e, i, n) {
    function s(o, a) {
        if (!i[o]) {
            if (!e[o]) {
                var l = "function" == typeof require && require;
                if (!a && l) return l(o, !0);
                if (r) return r(o, !0);
                var c = new Error("Cannot find module '" + o + "'");
                throw ((c.code = "MODULE_NOT_FOUND"), c);
            }
            var h = (i[o] = { exports: {} });
            e[o][0].call(
                h.exports,
                function (t) {
                    var i = e[o][1][t];
                    return s(i ? i : t);
                },
                h,
                h.exports,
                t,
                e,
                i,
                n
            );
        }
        return i[o].exports;
    }
    for (var r = "function" == typeof require && require, o = 0; o < n.length; o++) s(n[o]);
    return s;
})(
    {
        1: [
            function (t, e, i) {
                e.exports = {
                    VERSION: "1.0.0",
                    DEV_ID: "i5iSjo",
                    VERSION_PARAM: "&_av",
                    USAGE_PARAM: "&_au",
                    NULL_DIMENSION: "(not set)",
                };
            },
            {},
        ],
        2: [
            function (t, e, i) {
                function n() {
                    console.error(
                        "Requiring the `autotrack` plugin no longer requires all sub-plugins be default. See https://goo.gl/sZ2WrW for details."
                    );
                }
                var s = t("../provide");
                s("autotrack", n);
            },
            { "../provide": 12 },
        ],
        3: [
            function (t, e, i) {
                function n(t, e) {
                    l.track(t, l.plugins.CLEAN_URL_TRACKER),
                        (this.opts = s(
                            {
                                stripQuery: !1,
                                queryDimensionIndex: null,
                                indexFilename: null,
                                trailingSlash: null,
                            },
                            e
                        )),
                        (this.tracker = t),
                        this.overrideTrackerBuildHitTask();
                }
                var s = t("object-assign"),
                    r = t("dom-utils/lib/parse-url"),
                    o = t("../constants"),
                    a = t("../provide"),
                    l = t("../usage");
                (n.prototype.cleanUrlTask = function (t) {
                    var e = t.get("location"),
                        i = t.get("page"),
                        n = r(i || e),
                        s = n.pathname,
                        a = s;
                    if (this.opts.indexFilename) {
                        var l = a.split("/");
                        this.opts.indexFilename == l[l.length - 1] && ((l[l.length - 1] = ""), (a = l.join("/")));
                    }
                    if ("remove" == this.opts.trailingSlash) a = a.replace(/\/+$/, "");
                    else if ("add" == this.opts.trailingSlash) {
                        var c = /\.\w+$/.test(a);
                        c || "/" == a.substr(-1) || (a += "/");
                    }
                    this.opts.stripQuery &&
                        this.opts.queryDimensionIndex &&
                        t.set("dimension" + this.opts.queryDimensionIndex, n.query || o.NULL_DIMENSION),
                        t.set("page", a + (this.opts.stripQuery ? "" : n.search));
                }),
                    (n.prototype.overrideTrackerBuildHitTask = function () {
                        (this.originalTrackerBuildHitTask = this.tracker.get("buildHitTask")),
                            this.tracker.set(
                                "buildHitTask",
                                function (t) {
                                    this.cleanUrlTask(t), this.originalTrackerBuildHitTask(t);
                                }.bind(this)
                            );
                    }),
                    (n.prototype.remove = function () {
                        this.tracker.set("sendHitTask", this.originalTrackerSendHitTask);
                    }),
                    a("cleanUrlTracker", n);
            },
            {
                "../constants": 1,
                "../provide": 12,
                "../usage": 13,
                "dom-utils/lib/parse-url": 22,
                "object-assign": 23,
            },
        ],
        4: [
            function (t, e, i) {
                function n(t, e) {
                    if ((a.track(t, a.plugins.EVENT_TRACKER), window.addEventListener)) {
                        (this.opts = s(
                            {
                                events: ["click"],
                                fieldsObj: {},
                                attributePrefix: "ga-",
                                hitFilter: null,
                            },
                            e
                        )),
                            (this.tracker = t),
                            (this.handleEvents = this.handleEvents.bind(this));
                        var i = "[" + this.opts.attributePrefix + "on]";
                        (this.delegates = {}),
                            this.opts.events.forEach(
                                function (t) {
                                    this.delegates[t] = r(document, t, i, this.handleEvents, {
                                        deep: !0,
                                        useCapture: !0,
                                    });
                                }.bind(this)
                            );
                    }
                }
                var s = t("object-assign"),
                    r = t("dom-utils/lib/delegate"),
                    o = t("../provide"),
                    a = t("../usage"),
                    l = t("../utilities").createFieldsObj,
                    c = t("../utilities").getAttributeFields;
                (n.prototype.handleEvents = function (t, e) {
                    var i = this.opts.attributePrefix;
                    if (t.type == e.getAttribute(i + "on")) {
                        var n = { transport: "beacon" },
                            r = c(e, i),
                            o = s({}, this.opts.fieldsObj, r),
                            a = r.hitType || "event";
                        this.tracker.send(a, l(n, o, this.tracker, this.opts.hitFilter, e));
                    }
                }),
                    (n.prototype.remove = function () {
                        Object.keys(this.delegates).forEach(
                            function (t) {
                                this.delegates[t].destroy();
                            }.bind(this)
                        );
                    }),
                    o("eventTracker", n);
            },
            {
                "../provide": 12,
                "../usage": 13,
                "../utilities": 14,
                "dom-utils/lib/delegate": 18,
                "object-assign": 23,
            },
        ],
        5: [
            function (t, e, i) {
                function n(t, e) {
                    if (
                        (a.track(t, a.plugins.IMPRESSION_TRACKER),
                        window.IntersectionObserver && window.MutationObserver)
                    ) {
                        (this.opts = r(
                            {
                                elements: [],
                                rootMargin: "0px",
                                fieldsObj: {},
                                attributePrefix: "ga-",
                                hitFilter: null,
                            },
                            e
                        )),
                            (this.tracker = t),
                            (this.handleDomMutations = this.handleDomMutations.bind(this)),
                            (this.walkNodeTree = this.walkNodeTree.bind(this)),
                            (this.handleIntersectionChanges = this.handleIntersectionChanges.bind(this)),
                            (this.startObserving = this.startObserving.bind(this)),
                            (this.observeElement = this.observeElement.bind(this)),
                            (this.handleDomElementRemoved = this.handleDomElementRemoved.bind(this));
                        var i = this.deriveDataFromConfigOptions();
                        (this.items = i.items),
                            (this.elementMap = i.elementMap),
                            (this.threshold = i.threshold),
                            (this.intersectionObserver = this.initIntersectionObserver()),
                            (this.mutationObserver = this.initMutationObserver()),
                            c(this.startObserving);
                    }
                }
                function s(t, e) {
                    if (0 === t) {
                        var i = e.intersectionRect;
                        return i.top > 0 || i.bottom > 0 || i.left > 0 || i.right > 0;
                    }
                    return e.intersectionRatio >= t;
                }
                var r = t("object-assign"),
                    o = t("../provide"),
                    a = t("../usage"),
                    l = t("../utilities").createFieldsObj,
                    c = t("../utilities").domReady,
                    h = t("../utilities").getAttributeFields;
                (n.prototype.deriveDataFromConfigOptions = function () {
                    var t = [],
                        e = [],
                        i = {};
                    return (
                        this.opts.elements.forEach(function (n) {
                            "string" == typeof n && (n = { id: n }),
                                t.push((n = r({ threshold: 0, trackFirstImpressionOnly: !0 }, n))),
                                (i[n.id] = null),
                                e.push(n.threshold);
                        }),
                        { items: t, elementMap: i, threshold: e }
                    );
                }),
                    (n.prototype.initMutationObserver = function () {
                        return new MutationObserver(this.handleDomMutations);
                    }),
                    (n.prototype.initIntersectionObserver = function () {
                        return new IntersectionObserver(this.handleIntersectionChanges, {
                            rootMargin: this.opts.rootMargin,
                            threshold: this.threshold,
                        });
                    }),
                    (n.prototype.startObserving = function () {
                        Object.keys(this.elementMap).forEach(this.observeElement),
                            this.mutationObserver.observe(document.body, {
                                childList: !0,
                                subtree: !0,
                            }),
                            requestAnimationFrame(function () {});
                    }),
                    (n.prototype.observeElement = function (t) {
                        var e = this.elementMap[t] || (this.elementMap[t] = document.getElementById(t));
                        e && this.intersectionObserver.observe(e);
                    }),
                    (n.prototype.handleDomMutations = function (t) {
                        for (var e, i = 0; (e = t[i]); i++) {
                            for (var n, s = 0; (n = e.removedNodes[s]); s++)
                                this.walkNodeTree(n, this.handleDomElementRemoved);
                            for (var r, o = 0; (r = e.addedNodes[o]); o++) this.walkNodeTree(r, this.observeElement);
                        }
                    }),
                    (n.prototype.walkNodeTree = function (t, e) {
                        1 == t.nodeType && t.id in this.elementMap && e(t.id);
                        for (var i, n = 0; (i = t.childNodes[n]); n++) this.walkNodeTree(i, e);
                    }),
                    (n.prototype.handleIntersectionChanges = function (t) {
                        for (var e, i = 0; (e = t[i]); i++)
                            for (var n, r = 0; (n = this.items[r]); r++)
                                e.target.id === n.id &&
                                    s(n.threshold, e) &&
                                    (this.handleImpression(n.id),
                                    n.trackFirstImpressionOnly &&
                                        (this.items.splice(r, 1), r--, this.possiblyUnobserveElement(n.id)));
                        0 === this.items.length && this.remove();
                    }),
                    (n.prototype.handleImpression = function (t) {
                        var e = document.getElementById(t),
                            i = {
                                transport: "beacon",
                                eventCategory: "Viewport",
                                eventAction: "impression",
                                eventLabel: t,
                            },
                            n = r({}, this.opts.fieldsObj, h(e, this.opts.attributePrefix));
                        this.tracker.send("event", l(i, n, this.tracker, this.opts.hitFilter, e));
                    }),
                    (n.prototype.possiblyUnobserveElement = function (t) {
                        this.itemsIncludesId(t) ||
                            (this.intersectionObserver.unobserve(this.elementMap[t]), delete this.elementMap[t]);
                    }),
                    (n.prototype.handleDomElementRemoved = function (t) {
                        this.intersectionObserver.unobserve(this.elementMap[t]), (this.elementMap[t] = null);
                    }),
                    (n.prototype.itemsIncludesId = function (t) {
                        return this.items.some(function (e) {
                            return t == e.id;
                        });
                    }),
                    (n.prototype.remove = function () {
                        this.mutationObserver.disconnect(), this.intersectionObserver.disconnect();
                    }),
                    o("impressionTracker", n);
            },
            { "../provide": 12, "../usage": 13, "../utilities": 14, "object-assign": 23 },
        ],
        6: [
            function (t, e, i) {
                function n(t, e) {
                    c.track(t, c.plugins.MEDIA_QUERY_TRACKER),
                        window.matchMedia &&
                            ((this.opts = r(
                                {
                                    definitions: null,
                                    changeTemplate: this.changeTemplate,
                                    changeTimeout: 1e3,
                                    fieldsObj: {},
                                    hitFilter: null,
                                },
                                e
                            )),
                            u(this.opts.definitions) &&
                                ((this.opts.definitions = d(this.opts.definitions)),
                                (this.tracker = t),
                                (this.changeListeners = []),
                                this.processMediaQueries()));
                }
                function s(t) {
                    return p[t] ? p[t] : ((p[t] = window.matchMedia(t)), p[t]);
                }
                var r = t("object-assign"),
                    o = t("debounce"),
                    a = t("../constants"),
                    l = t("../provide"),
                    c = t("../usage"),
                    h = t("../utilities").createFieldsObj,
                    u = t("../utilities").isObject,
                    d = t("../utilities").toArray,
                    p = {};
                (n.prototype.processMediaQueries = function () {
                    this.opts.definitions.forEach(
                        function (t) {
                            if (t.name && t.dimensionIndex) {
                                var e = this.getMatchName(t);
                                this.tracker.set("dimension" + t.dimensionIndex, e), this.addChangeListeners(t);
                            }
                        }.bind(this)
                    );
                }),
                    (n.prototype.getMatchName = function (t) {
                        var e;
                        return (
                            t.items.forEach(function (t) {
                                s(t.media).matches && (e = t);
                            }),
                            e ? e.name : a.NULL_DIMENSION
                        );
                    }),
                    (n.prototype.addChangeListeners = function (t) {
                        t.items.forEach(
                            function (e) {
                                var i = s(e.media),
                                    n = o(
                                        function () {
                                            this.handleChanges(t);
                                        }.bind(this),
                                        this.opts.changeTimeout
                                    );
                                i.addListener(n), this.changeListeners.push({ mql: i, fn: n });
                            }.bind(this)
                        );
                    }),
                    (n.prototype.handleChanges = function (t) {
                        var e = this.getMatchName(t),
                            i = this.tracker.get("dimension" + t.dimensionIndex);
                        if (e !== i) {
                            this.tracker.set("dimension" + t.dimensionIndex, e);
                            var n = {
                                eventCategory: t.name,
                                eventAction: "change",
                                eventLabel: this.opts.changeTemplate(i, e),
                            };
                            this.tracker.send("event", h(n, this.opts.fieldsObj, this.tracker, this.opts.hitFilter));
                        }
                    }),
                    (n.prototype.remove = function () {
                        for (var t, e = 0; (t = this.changeListeners[e]); e++) t.mql.removeListener(t.fn);
                    }),
                    (n.prototype.changeTemplate = function (t, e) {
                        return t + " => " + e;
                    }),
                    l("mediaQueryTracker", n);
            },
            {
                "../constants": 1,
                "../provide": 12,
                "../usage": 13,
                "../utilities": 14,
                debounce: 16,
                "object-assign": 23,
            },
        ],
        7: [
            function (t, e, i) {
                function n(t, e) {
                    l.track(t, l.plugins.OUTBOUND_FORM_TRACKER),
                        window.addEventListener &&
                            ((this.opts = s(
                                {
                                    formSelector: "form",
                                    shouldTrackOutboundForm: this.shouldTrackOutboundForm,
                                    fieldsObj: {},
                                    attributePrefix: "ga-",
                                    hitFilter: null,
                                },
                                e
                            )),
                            (this.tracker = t),
                            (this.delegate = r(document, "submit", "form", this.handleFormSubmits.bind(this), {
                                deep: !0,
                                useCapture: !0,
                            })));
                }
                var s = t("object-assign"),
                    r = t("dom-utils/lib/delegate"),
                    o = t("dom-utils/lib/parse-url"),
                    a = t("../provide"),
                    l = t("../usage"),
                    c = t("../utilities").createFieldsObj,
                    h = t("../utilities").getAttributeFields,
                    u = t("../utilities").withTimeout;
                (n.prototype.handleFormSubmits = function (t, e) {
                    var i = o(e.action).href,
                        n = {
                            transport: "beacon",
                            eventCategory: "Outbound Form",
                            eventAction: "submit",
                            eventLabel: i,
                        };
                    if (this.opts.shouldTrackOutboundForm(e, o)) {
                        navigator.sendBeacon ||
                            (t.preventDefault(),
                            (n.hitCallback = u(function () {
                                e.submit();
                            })));
                        var r = s({}, this.opts.fieldsObj, h(e, this.opts.attributePrefix));
                        this.tracker.send("event", c(n, r, this.tracker, this.opts.hitFilter, e));
                    }
                }),
                    (n.prototype.shouldTrackOutboundForm = function (t, e) {
                        var i = e(t.action);
                        return i.hostname != location.hostname && "http" == i.protocol.slice(0, 4);
                    }),
                    (n.prototype.remove = function () {
                        this.delegate.destroy();
                    }),
                    a("outboundFormTracker", n);
            },
            {
                "../provide": 12,
                "../usage": 13,
                "../utilities": 14,
                "dom-utils/lib/delegate": 18,
                "dom-utils/lib/parse-url": 22,
                "object-assign": 23,
            },
        ],
        8: [
            function (t, e, i) {
                function n(t, e) {
                    l.track(t, l.plugins.OUTBOUND_LINK_TRACKER),
                        window.addEventListener &&
                            ((this.opts = s(
                                {
                                    events: ["click"],
                                    linkSelector: "a",
                                    shouldTrackOutboundLink: this.shouldTrackOutboundLink,
                                    fieldsObj: {},
                                    attributePrefix: "ga-",
                                    hitFilter: null,
                                },
                                e
                            )),
                            (this.tracker = t),
                            (this.handleLinkInteractions = this.handleLinkInteractions.bind(this)),
                            (this.delegates = {}),
                            this.opts.events.forEach(
                                function (t) {
                                    this.delegates[t] = r(
                                        document,
                                        t,
                                        this.opts.linkSelector,
                                        this.handleLinkInteractions,
                                        { deep: !0, useCapture: !0 }
                                    );
                                }.bind(this)
                            ));
                }
                var s = t("object-assign"),
                    r = t("dom-utils/lib/delegate"),
                    o = t("dom-utils/lib/parse-url"),
                    a = t("../provide"),
                    l = t("../usage"),
                    c = t("../utilities").createFieldsObj,
                    h = t("../utilities").getAttributeFields;
                (n.prototype.handleLinkInteractions = function (t, e) {
                    if (this.opts.shouldTrackOutboundLink(e, o)) {
                        navigator.sendBeacon || (e.target = "_blank");
                        var i = {
                                transport: "beacon",
                                eventCategory: "Outbound Link",
                                eventAction: t.type,
                                eventLabel: e.href,
                            },
                            n = s({}, this.opts.fieldsObj, h(e, this.opts.attributePrefix));
                        this.tracker.send("event", c(i, n, this.tracker, this.opts.hitFilter, e));
                    }
                }),
                    (n.prototype.shouldTrackOutboundLink = function (t, e) {
                        var i = e(t.href);
                        return i.hostname != location.hostname && "http" == i.protocol.slice(0, 4);
                    }),
                    (n.prototype.remove = function () {
                        Object.keys(this.delegates).forEach(
                            function (t) {
                                this.delegates[t].destroy();
                            }.bind(this)
                        );
                    }),
                    a("outboundLinkTracker", n);
            },
            {
                "../provide": 12,
                "../usage": 13,
                "../utilities": 14,
                "dom-utils/lib/delegate": 18,
                "dom-utils/lib/parse-url": 22,
                "object-assign": 23,
            },
        ],
        9: [
            function (t, e, i) {
                function n(t, e) {
                    o.track(t, o.plugins.PAGE_VISIBILITY_TRACKER),
                        window.addEventListener &&
                            ((this.opts = s(
                                {
                                    sessionTimeout: c,
                                    changeTemplate: this.changeTemplate,
                                    hiddenMetricIndex: null,
                                    visibleMetricIndex: null,
                                    fieldsObj: {},
                                    hitFilter: null,
                                },
                                e
                            )),
                            (this.tracker = t),
                            (this.visibilityState = document.visibilityState),
                            (this.lastVisibilityChangeTime = +new Date()),
                            (this.handleVisibilityStateChange = this.handleVisibilityStateChange.bind(this)),
                            this.overrideTrackerSendMethod(),
                            this.overrideTrackerSendHitTask(),
                            document.addEventListener("visibilitychange", this.handleVisibilityStateChange));
                }
                var s = t("object-assign"),
                    r = t("../provide"),
                    o = t("../usage"),
                    a = t("../utilities").createFieldsObj,
                    l = t("../utilities").isObject,
                    c = 30;
                (n.prototype.handleVisibilityStateChange = function () {
                    var t;
                    if (
                        ((this.prevVisibilityState = this.visibilityState),
                        (this.visibilityState = document.visibilityState),
                        this.sessionHasTimedOut())
                    ) {
                        if ("hidden" == this.visibilityState) return;
                        "visible" == this.visibilityState &&
                            ((t = { transport: "beacon" }),
                            this.tracker.send(
                                "pageview",
                                a(t, this.opts.fieldsObj, this.tracker, this.opts.hitFilter)
                            ));
                    } else {
                        var e = Math.round((new Date() - this.lastVisibilityChangeTime) / 1e3) || 1;
                        (t = {
                            transport: "beacon",
                            eventCategory: "Page Visibility",
                            eventAction: "change",
                            eventLabel: this.opts.changeTemplate(this.prevVisibilityState, this.visibilityState),
                            eventValue: e,
                        }),
                            "hidden" == this.visibilityState && (t.nonInteraction = !0);
                        var i = this.opts[this.prevVisibilityState + "MetricIndex"];
                        i && (t["metric" + i] = e),
                            this.tracker.send("event", a(t, this.opts.fieldsObj, this.tracker, this.opts.hitFilter));
                    }
                    this.lastVisibilityChangeTime = +new Date();
                }),
                    (n.prototype.sessionHasTimedOut = function () {
                        var t = (new Date() - this.lastHitTime) / 6e4;
                        return this.opts.sessionTimeout < t;
                    }),
                    (n.prototype.overrideTrackerSendMethod = function () {
                        (this.originalTrackerSendMethod = this.tracker.send),
                            (this.tracker.send = function () {
                                var t = Array.prototype.slice.call(arguments),
                                    e = t[0],
                                    i = l(e) ? e.hitType : e,
                                    n = "pageview" == i;
                                if (!n && this.sessionHasTimedOut()) {
                                    var s = { transport: "beacon" };
                                    this.originalTrackerSendMethod.call(
                                        this.tracker,
                                        "pageview",
                                        a(s, this.opts.fieldsObj, this.tracker, this.opts.hitFilter)
                                    );
                                }
                                this.originalTrackerSendMethod.apply(this.tracker, t);
                            }.bind(this));
                    }),
                    (n.prototype.overrideTrackerSendHitTask = function () {
                        (this.originalTrackerSendHitTask = this.tracker.get("sendHitTask")),
                            (this.lastHitTime = +new Date()),
                            this.tracker.set(
                                "sendHitTask",
                                function (t) {
                                    this.originalTrackerSendHitTask(t), (this.lastHitTime = +new Date());
                                }.bind(this)
                            );
                    }),
                    (n.prototype.changeTemplate = function (t, e) {
                        return t + " => " + e;
                    }),
                    (n.prototype.remove = function () {
                        this.tracker.set("sendHitTask", this.originalTrackerSendHitTask),
                            (this.tracker.send = this.originalTrackerSendMethod),
                            document.removeEventListener("visibilitychange", this.handleVisibilityStateChange);
                    }),
                    r("pageVisibilityTracker", n);
            },
            { "../provide": 12, "../usage": 13, "../utilities": 14, "object-assign": 23 },
        ],
        10: [
            function (t, e, i) {
                function n(t, e) {
                    o.track(t, o.plugins.SOCIAL_WIDGET_TRACKER),
                        window.addEventListener &&
                            ((this.opts = s({ fieldsObj: {}, hitFilter: null }, e)),
                            (this.tracker = t),
                            (this.addWidgetListeners = this.addWidgetListeners.bind(this)),
                            (this.addTwitterEventHandlers = this.addTwitterEventHandlers.bind(this)),
                            (this.handleTweetEvents = this.handleTweetEvents.bind(this)),
                            (this.handleFollowEvents = this.handleFollowEvents.bind(this)),
                            (this.handleLikeEvents = this.handleLikeEvents.bind(this)),
                            (this.handleUnlikeEvents = this.handleUnlikeEvents.bind(this)),
                            "complete" != document.readyState
                                ? window.addEventListener("load", this.addWidgetListeners)
                                : this.addWidgetListeners());
                }
                var s = t("object-assign"),
                    r = t("../provide"),
                    o = t("../usage"),
                    a = t("../utilities").createFieldsObj;
                (n.prototype.addWidgetListeners = function () {
                    window.FB && this.addFacebookEventHandlers(), window.twttr && this.addTwitterEventHandlers();
                }),
                    (n.prototype.addTwitterEventHandlers = function () {
                        try {
                            twttr.ready(
                                function () {
                                    twttr.events.bind("tweet", this.handleTweetEvents),
                                        twttr.events.bind("follow", this.handleFollowEvents);
                                }.bind(this)
                            );
                        } catch (t) {}
                    }),
                    (n.prototype.removeTwitterEventHandlers = function () {
                        try {
                            twttr.ready(
                                function () {
                                    twttr.events.unbind("tweet", this.handleTweetEvents),
                                        twttr.events.unbind("follow", this.handleFollowEvents);
                                }.bind(this)
                            );
                        } catch (t) {}
                    }),
                    (n.prototype.addFacebookEventHandlers = function () {
                        try {
                            FB.Event.subscribe("edge.create", this.handleLikeEvents),
                                FB.Event.subscribe("edge.remove", this.handleUnlikeEvents);
                        } catch (t) {}
                    }),
                    (n.prototype.removeFacebookEventHandlers = function () {
                        try {
                            FB.Event.unsubscribe("edge.create", this.handleLikeEvents),
                                FB.Event.unsubscribe("edge.remove", this.handleUnlikeEvents);
                        } catch (t) {}
                    }),
                    (n.prototype.handleTweetEvents = function (t) {
                        if ("tweet" == t.region) {
                            var e = t.data.url || t.target.getAttribute("data-url") || location.href,
                                i = {
                                    transport: "beacon",
                                    socialNetwork: "Twitter",
                                    socialAction: "tweet",
                                    socialTarget: e,
                                };
                            this.tracker.send("social", a(i, this.opts.fieldsObj, this.tracker, this.opts.hitFilter));
                        }
                    }),
                    (n.prototype.handleFollowEvents = function (t) {
                        if ("follow" == t.region) {
                            var e = t.data.screen_name || t.target.getAttribute("data-screen-name"),
                                i = {
                                    transport: "beacon",
                                    socialNetwork: "Twitter",
                                    socialAction: "follow",
                                    socialTarget: e,
                                };
                            this.tracker.send("social", a(i, this.opts.fieldsObj, this.tracker, this.opts.hitFilter));
                        }
                    }),
                    (n.prototype.handleLikeEvents = function (t) {
                        var e = {
                            transport: "beacon",
                            socialNetwork: "Facebook",
                            socialAction: "like",
                            socialTarget: t,
                        };
                        this.tracker.send("social", a(e, this.opts.fieldsObj, this.tracker, this.opts.hitFilter));
                    }),
                    (n.prototype.handleUnlikeEvents = function (t) {
                        var e = {
                            transport: "beacon",
                            socialNetwork: "Facebook",
                            socialAction: "unlike",
                            socialTarget: t,
                        };
                        this.tracker.send("social", a(e, this.opts.fieldsObj, this.tracker, this.opts.hitFilter));
                    }),
                    (n.prototype.remove = function () {
                        window.removeEventListener("load", this.addWidgetListeners),
                            this.removeFacebookEventHandlers(),
                            this.removeTwitterEventHandlers();
                    }),
                    r("socialWidgetTracker", n);
            },
            { "../provide": 12, "../usage": 13, "../utilities": 14, "object-assign": 23 },
        ],
        11: [
            function (t, e, i) {
                function n(t, e) {
                    a.track(t, a.plugins.URL_CHANGE_TRACKER),
                        history.pushState &&
                            window.addEventListener &&
                            ((this.opts = r(
                                {
                                    shouldTrackUrlChange: this.shouldTrackUrlChange,
                                    fieldsObj: {},
                                    hitFilter: null,
                                },
                                e
                            )),
                            (this.tracker = t),
                            (this.path = s()),
                            (this.updateTrackerData = this.updateTrackerData.bind(this)),
                            (this.originalPushState = history.pushState),
                            (history.pushState = function (t, e) {
                                c(t) && e && (t.title = e),
                                    this.originalPushState.apply(history, arguments),
                                    this.updateTrackerData();
                            }.bind(this)),
                            (this.originalReplaceState = history.replaceState),
                            (history.replaceState = function (t, e) {
                                c(t) && e && (t.title = e),
                                    this.originalReplaceState.apply(history, arguments),
                                    this.updateTrackerData(!1);
                            }.bind(this)),
                            window.addEventListener("popstate", this.updateTrackerData));
                }
                function s() {
                    return location.pathname + location.search;
                }
                var r = t("object-assign"),
                    o = t("../provide"),
                    a = t("../usage"),
                    l = t("../utilities").createFieldsObj,
                    c = t("../utilities").isObject;
                (n.prototype.updateTrackerData = function (t) {
                    (t = t !== !1),
                        setTimeout(
                            function () {
                                var e = this.path,
                                    i = s();
                                if (
                                    e != i &&
                                    this.opts.shouldTrackUrlChange.call(this, i, e) &&
                                    ((this.path = i),
                                    this.tracker.set({
                                        page: i,
                                        title: (c(history.state) && history.state.title) || document.title,
                                    }),
                                    t)
                                ) {
                                    var n = { transport: "beacon" };
                                    this.tracker.send(
                                        "pageview",
                                        l(n, this.opts.fieldsObj, this.tracker, this.opts.hitFilter)
                                    );
                                }
                            }.bind(this),
                            0
                        );
                }),
                    (n.prototype.shouldTrackUrlChange = function (t, e) {
                        return t && e;
                    }),
                    (n.prototype.remove = function () {
                        window.removeEventListener("popstate", this.updateTrackerData),
                            (history.replaceState = this.originalReplaceState),
                            (history.pushState = this.originalPushState),
                            (this.tracker = null),
                            (this.opts = null),
                            (this.path = null),
                            (this.updateTrackerData = null),
                            (this.originalReplaceState = null),
                            (this.originalPushState = null);
                    }),
                    o("urlChangeTracker", n);
            },
            { "../provide": 12, "../usage": 13, "../utilities": 14, "object-assign": 23 },
        ],
        12: [
            function (t, e, i) {
                var n = t("./constants"),
                    s = t("./utilities");
                (window.gaDevIds = window.gaDevIds || []).push(n.DEV_ID),
                    (e.exports = function (t, e) {
                        var i = window.GoogleAnalyticsObject || "ga";
                        (window[i] =
                            window[i] ||
                            function () {
                                (window[i].q = window[i].q || []).push(arguments);
                            }),
                            window[i]("provide", t, e),
                            (window.gaplugins = window.gaplugins || {}),
                            (window.gaplugins[s.capitalize(t)] = e);
                    });
            },
            { "./constants": 1, "./utilities": 14 },
        ],
        13: [
            function (t, e, i) {
                function n(t) {
                    return parseInt(t || "0", 16).toString(2);
                }
                function s(t) {
                    return parseInt(t || "0", 2).toString(16);
                }
                function r(t, e) {
                    if (t.length < e) for (var i = e - t.length; i; ) (t = "0" + t), i--;
                    return t;
                }
                function o(t, e) {
                    return t.substr(0, e) + 1 + t.substr(e + 1);
                }
                function a(t, e) {
                    var i = t.get(c.USAGE_PARAM),
                        a = r(n(i), u);
                    (a = o(a, u - e)), t.set(c.USAGE_PARAM, s(a));
                }
                function l(t) {
                    t.set(c.VERSION_PARAM, c.VERSION);
                }
                var c = t("./constants"),
                    h = {
                        CLEAN_URL_TRACKER: 1,
                        EVENT_TRACKER: 2,
                        IMPRESSION_TRACKER: 3,
                        MEDIA_QUERY_TRACKER: 4,
                        OUTBOUND_FORM_TRACKER: 5,
                        OUTBOUND_LINK_TRACKER: 6,
                        PAGE_VISIBILITY_TRACKER: 7,
                        SOCIAL_WIDGET_TRACKER: 8,
                        URL_CHANGE_TRACKER: 9,
                    },
                    u = 9;
                e.exports = {
                    track: function (t, e) {
                        l(t), a(t, e);
                    },
                    plugins: h,
                };
            },
            { "./constants": 1 },
        ],
        14: [
            function (t, e, i) {
                var n = t("object-assign"),
                    s = t("dom-utils/lib/get-attributes"),
                    r = {
                        createFieldsObj: function (t, e, i, s, r) {
                            if ("function" == typeof s) {
                                var o = i.get("buildHitTask");
                                return {
                                    buildHitTask: function (i) {
                                        i.set(t, null, !0), i.set(e, null, !0), s(i, r), o(i);
                                    },
                                };
                            }
                            return n({}, t, e);
                        },
                        getAttributeFields: function (t, e) {
                            var i = s(t),
                                n = {};
                            return (
                                Object.keys(i).forEach(function (t) {
                                    if (0 === t.indexOf(e) && t != e + "on") {
                                        var s = i[t];
                                        "true" == s && (s = !0), "false" == s && (s = !1);
                                        var o = r.camelCase(t.slice(e.length));
                                        n[o] = s;
                                    }
                                }),
                                n
                            );
                        },
                        domReady: function (t) {
                            "loading" == document.readyState
                                ? document.addEventListener("DOMContentLoaded", function e() {
                                      document.removeEventListener("DOMContentLoaded", e), t();
                                  })
                                : t();
                        },
                        withTimeout: function (t, e) {
                            var i = !1;
                            return (
                                setTimeout(t, e || 2e3),
                                function () {
                                    i || ((i = !0), t());
                                }
                            );
                        },
                        camelCase: function (t) {
                            return t.replace(/[\-\_]+(\w?)/g, function (t, e) {
                                return e.toUpperCase();
                            });
                        },
                        capitalize: function (t) {
                            return t.charAt(0).toUpperCase() + t.slice(1);
                        },
                        isObject: function (t) {
                            return "object" == typeof t && null !== t;
                        },
                        isArray:
                            Array.isArray ||
                            function (t) {
                                return "[object Array]" === Object.prototype.toString.call(t);
                            },
                        toArray: function (t) {
                            return r.isArray(t) ? t : [t];
                        },
                    };
                e.exports = r;
            },
            { "dom-utils/lib/get-attributes": 19, "object-assign": 23 },
        ],
        15: [
            function (t, e, i) {
                function n() {
                    return new Date().getTime();
                }
                e.exports = Date.now || n;
            },
            {},
        ],
        16: [
            function (t, e, i) {
                var n = t("date-now");
                e.exports = function (t, e, i) {
                    function s() {
                        var h = n() - l;
                        h < e && h > 0
                            ? (r = setTimeout(s, e - h))
                            : ((r = null), i || ((c = t.apply(a, o)), r || (a = o = null)));
                    }
                    var r, o, a, l, c;
                    return (
                        null == e && (e = 100),
                        function () {
                            (a = this), (o = arguments), (l = n());
                            var h = i && !r;
                            return r || (r = setTimeout(s, e)), h && ((c = t.apply(a, o)), (a = o = null)), c;
                        }
                    );
                };
            },
            { "date-now": 15 },
        ],
        17: [
            function (t, e, i) {
                var n = t("./matches"),
                    s = t("./parents");
                e.exports = function (t, e, i) {
                    if (t && 1 == t.nodeType && e)
                        for (var r, o = (i ? [t] : []).concat(s(t)), a = 0; (r = o[a]); a++) if (n(r, e)) return r;
                };
            },
            { "./matches": 20, "./parents": 21 },
        ],
        18: [
            function (t, e, i) {
                var n = t("./closest"),
                    s = t("./matches");
                e.exports = function (t, e, i, r, o) {
                    o = o || {};
                    var a = function (t) {
                        if (o.deep && "function" == typeof t.deepPath)
                            for (var e, a = t.deepPath(), l = 0; (e = a[l]); l++) 1 == e.nodeType && s(e, i) && (c = e);
                        else var c = n(t.target, i, !0);
                        c && r.call(c, t, c);
                    };
                    return (
                        t.addEventListener(e, a, o.useCapture),
                        {
                            destroy: function () {
                                t.removeEventListener(e, a, o.useCapture);
                            },
                        }
                    );
                };
            },
            { "./closest": 17, "./matches": 20 },
        ],
        19: [
            function (t, e, i) {
                e.exports = function (t) {
                    var e = {};
                    if (!t || 1 != t.nodeType) return e;
                    var i = t.attributes;
                    if (0 === i.length) return {};
                    for (var n, s = 0; (n = i[s]); s++) e[n.name] = n.value;
                    return e;
                };
            },
            {},
        ],
        20: [
            function (t, e, i) {
                function n(t, e) {
                    if ("string" != typeof e) return !1;
                    if (r) return r.call(t, e);
                    for (var i, n = t.parentNode.querySelectorAll(e), s = 0; (i = n[s]); s++) if (i == t) return !0;
                    return !1;
                }
                var s = window.Element.prototype,
                    r =
                        s.matches ||
                        s.matchesSelector ||
                        s.webkitMatchesSelector ||
                        s.mozMatchesSelector ||
                        s.msMatchesSelector ||
                        s.oMatchesSelector;
                e.exports = function (t, e) {
                    if (t && 1 == t.nodeType && e) {
                        if ("string" == typeof e || 1 == e.nodeType) return t == e || n(t, e);
                        if ("length" in e) for (var i, s = 0; (i = e[s]); s++) if (t == i || n(t, i)) return !0;
                    }
                    return !1;
                };
            },
            {},
        ],
        21: [
            function (t, e, i) {
                e.exports = function (t) {
                    for (var e = []; t && t.parentNode && 1 == t.parentNode.nodeType; ) e.push((t = t.parentNode));
                    return e;
                };
            },
            {},
        ],
        22: [
            function (t, e, i) {
                var n = "80",
                    s = "443",
                    r = RegExp(":(" + n + "|" + s + ")$"),
                    o = document.createElement("a"),
                    a = {};
                e.exports = function t(e) {
                    if (((e = e && "." != e ? e : location.href), a[e])) return a[e];
                    if (((o.href = e), "." == e.charAt(0))) return t(o.href);
                    var i = o.protocol && ":" != o.protocol ? o.protocol : location.protocol,
                        l = o.port == n || o.port == s ? "" : o.port;
                    l = "0" == l ? "" : l;
                    var c = "" == o.host ? location.host : o.host,
                        h = "" == o.hostname ? location.hostname : o.hostname;
                    c = c.replace(r, "");
                    var u = o.origin ? o.origin : i + "//" + c,
                        d = "/" == o.pathname.charAt(0) ? o.pathname : "/" + o.pathname;
                    return (a[e] = {
                        hash: o.hash,
                        host: c,
                        hostname: h,
                        href: o.href,
                        origin: u,
                        pathname: d,
                        port: l,
                        protocol: i,
                        search: o.search,
                        fragment: o.hash.slice(1),
                        path: d + o.search,
                        query: o.search.slice(1),
                    });
                };
            },
            {},
        ],
        23: [
            function (t, e, i) {
                "use strict";
                function n(t) {
                    if (null === t || void 0 === t)
                        throw new TypeError("Object.assign cannot be called with null or undefined");
                    return Object(t);
                }
                function s() {
                    try {
                        if (!Object.assign) return !1;
                        var t = new String("abc");
                        if (((t[5] = "de"), "5" === Object.getOwnPropertyNames(t)[0])) return !1;
                        for (var e = {}, i = 0; i < 10; i++) e["_" + String.fromCharCode(i)] = i;
                        var n = Object.getOwnPropertyNames(e).map(function (t) {
                            return e[t];
                        });
                        if ("0123456789" !== n.join("")) return !1;
                        var s = {};
                        return (
                            "abcdefghijklmnopqrst".split("").forEach(function (t) {
                                s[t] = t;
                            }),
                            "abcdefghijklmnopqrst" === Object.keys(Object.assign({}, s)).join("")
                        );
                    } catch (t) {
                        return !1;
                    }
                }
                var r = Object.prototype.hasOwnProperty,
                    o = Object.prototype.propertyIsEnumerable;
                e.exports = s()
                    ? Object.assign
                    : function (t, e) {
                          for (var i, s, a = n(t), l = 1; l < arguments.length; l++) {
                              i = Object(arguments[l]);
                              for (var c in i) r.call(i, c) && (a[c] = i[c]);
                              if (Object.getOwnPropertySymbols) {
                                  s = Object.getOwnPropertySymbols(i);
                                  for (var h = 0; h < s.length; h++) o.call(i, s[h]) && (a[s[h]] = i[s[h]]);
                              }
                          }
                          return a;
                      };
            },
            {},
        ],
        24: [
            function (t, e, i) {
                t("./plugins/clean-url-tracker"),
                    t("./plugins/event-tracker"),
                    t("./plugins/impression-tracker"),
                    t("./plugins/media-query-tracker"),
                    t("./plugins/outbound-form-tracker"),
                    t("./plugins/outbound-link-tracker"),
                    t("./plugins/page-visibility-tracker"),
                    t("./plugins/social-widget-tracker"),
                    t("./plugins/url-change-tracker"),
                    t("./plugins/autotrack");
            },
            {
                "./plugins/autotrack": 2,
                "./plugins/clean-url-tracker": 3,
                "./plugins/event-tracker": 4,
                "./plugins/impression-tracker": 5,
                "./plugins/media-query-tracker": 6,
                "./plugins/outbound-form-tracker": 7,
                "./plugins/outbound-link-tracker": 8,
                "./plugins/page-visibility-tracker": 9,
                "./plugins/social-widget-tracker": 10,
                "./plugins/url-change-tracker": 11,
            },
        ],
    },
    {},
    [24]
);
//# sourceMappingURL=autotrack.js.map
