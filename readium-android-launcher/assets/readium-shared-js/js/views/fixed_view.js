//  Created by Boris Schneiderman.
//  Copyright (c) 2014 Readium Foundation and/or its licensees. All rights reserved.
//  
//  Redistribution and use in source and binary forms, with or without modification, 
//  are permitted provided that the following conditions are met:
//  1. Redistributions of source code must retain the above copyright notice, this 
//  list of conditions and the following disclaimer.
//  2. Redistributions in binary form must reproduce the above copyright notice, 
//  this list of conditions and the following disclaimer in the documentation and/or 
//  other materials provided with the distribution.
//  3. Neither the name of the organization nor the names of its contributors may be 
//  used to endorse or promote products derived from this software without specific 
//  prior written permission.
//  
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
//  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
//  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
//  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, 
//  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, 
//  BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, 
//  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF 
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE 
//  OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
//  OF THE POSSIBILITY OF SUCH DAMAGE.

/*
 * View for rendering fixed layout page spread
 * @class ReadiumSDK.Views.FixedView
 */

ReadiumSDK.Views.FixedView = function(options){

    _.extend(this, Backbone.Events);

    var self = this;

    var _$el;
    var _$viewport = options.$viewport;
    var _spine = options.spine;
    var _userStyles = options.userStyles;
    var _bookStyles = options.bookStyles;
    var _iframeLoader = options.iframeLoader;
    var _enablePageTransitions = options.enablePageTransitions;

    var _leftPageView = createOnePageView("fixed-page-frame-left");
    var _rightPageView = createOnePageView("fixed-page-frame-right");
    var _centerPageView = createOnePageView("fixed-page-frame-center");

    var _pageViews = [];
    _pageViews.push(_leftPageView);
    _pageViews.push(_rightPageView);
    _pageViews.push(_centerPageView);

    var _spread = new ReadiumSDK.Models.Spread(_spine, ReadiumSDK.Helpers.getOrientation(_$viewport));
    var _bookMargins;
    var _contentMetaSize;

    function createOnePageView(elementClass) {

        var pageView = new ReadiumSDK.Views.OnePageView({

            iframeLoader: _iframeLoader,
            spine: _spine,
            bookStyles: _bookStyles,
            // class: cssclass,
            // contentAlignment: contentAlignment,
            enablePageTransitions: _enablePageTransitions
        },
        [elementClass],
        false); //enableBookStyleOverrides

        pageView.on(ReadiumSDK.Views.OnePageView.SPINE_ITEM_OPEN_START, function($iframe, spineItem) {

            self.trigger(ReadiumSDK.Events.CONTENT_DOCUMENT_LOAD_START, $iframe, spineItem);
        });   
    
        return pageView;
    }

    this.isReflowable = function() {
        return false;
    };

    this.render = function(){

        var template = ReadiumSDK.Helpers.loadTemplate("fixed_book_frame", {});

        _$el = $(template);
        
        _.each(['-webkit-', '-moz-', '-ms-', ''], function(prefix) {
            _$el.css(prefix + "transition", "all 0 ease 0");
        });
        
        _$el.css("overflow", "hidden");
        
        _$viewport.append(_$el);

        self.applyStyles();

        return this;
    };

    this.remove = function() {

        _$el.remove();
    };

    var _viewSettings = undefined;
    this.setViewSettings = function(settings) {
        
        _viewSettings = settings;
        
        _spread.setSyntheticSpread(settings.isSyntheticSpread);

        var views = getDisplayingViews();
        for(var i = 0, count = views.length; i < count; i++) {
            views[i].setViewSettings(settings);
        }
    };

    function redraw(initiator, paginationRequest) {

        var context = {isElementAdded : false};
        var pageLoadDeferrals = createPageLoadDeferrals([{pageView: _leftPageView, spineItem: _spread.leftItem, context: context},
                                                              {pageView: _rightPageView, spineItem: _spread.rightItem, context: context},
                                                              {pageView: _centerPageView, spineItem: _spread.centerItem, context: context}]);
        if(pageLoadDeferrals.length > 0) {

            $.when.apply($, pageLoadDeferrals).done(function(){
                if(context.isElementAdded) {
                    self.applyStyles();
                }

                if (paginationRequest)
                {
                    onPagesLoaded(initiator, paginationRequest.spineItem, paginationRequest.elementId)
                }
                else
                {
                    onPagesLoaded(initiator);
                }
            });
        }
    }

    var updatePageSwitchDir = function(dir, hasChanged)
    {
// console.error("updatePageSwitchDir");
// console.log(dir);
// console.log(hasChanged);
// 
        // irrespective of display state
        if (_leftPageView) _leftPageView.pageSwitchDir(dir, hasChanged);
        if (_rightPageView) _rightPageView.pageSwitchDir(dir, hasChanged);
        if (_centerPageView) _centerPageView.pageSwitchDir(dir, hasChanged);

        // var views = getDisplayingViews();
        // for(var i = 0, count = views.length; i < count; i++) {
        //     views[i].pageSwitchDir(dir, hasChanged);
        // }
    };
    

    this.applyStyles = function() {

        ReadiumSDK.Helpers.setStyles(_userStyles.getStyles(), _$el.parent());

        updateBookMargins();
        updateContentMetaSize();

        updatePageSwitchDir(0, false);
        resizeBook();
    };

    this.applyBookStyles = function() {

        var views = getDisplayingViews();

        for(var i = 0, count = views.length; i < count; i++) {
            views[i].applyBookStyles();
        }
    };

    function createPageLoadDeferrals(viewItemPairs) {

        var pageLoadDeferrals = [];

        for(var i = 0; i < viewItemPairs.length; i++) {

            var dfd = updatePageViewForItem(viewItemPairs[i].pageView, viewItemPairs[i].spineItem, viewItemPairs[i].context);
            if(dfd) {
                pageLoadDeferrals.push(dfd);
            }

        }

        return pageLoadDeferrals;

    }

    function onPagesLoaded(initiator, paginationRequest_spineItem, paginationRequest_elementId) {

        updateContentMetaSize();
        resizeBook();

        self.trigger(ReadiumSDK.InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED, { paginationInfo: self.getPaginationInfo(), initiator: initiator, spineItem: paginationRequest_spineItem, elementId: paginationRequest_elementId } );
    }

    this.onViewportResize = function() {

        //because change of the viewport orientation can alter pagination behaviour we have to check if
        //visible content stays same
        var newOrientation = ReadiumSDK.Helpers.getOrientation(_$viewport);
        if(!newOrientation) {
            return;
        }

        var spreadChanged = false;
        var itemToDisplay = undefined;
        if(_spread.orientation != newOrientation) {

            var newPageSpread = new ReadiumSDK.Models.Spread(_spine, newOrientation);

            var visibleItems = _spread.validItems();
            if(visibleItems.length > 0) {
                newPageSpread.openItem(visibleItems[0]);
            }

            spreadChanged = (  _spread.leftItem != newPageSpread.leftItem
                            || _spread.rightItem != newPageSpread.rightItem
                            || _spread.centerItem != newPageSpread.centerItem );

            _spread.orientation = newOrientation;
        }

        if(spreadChanged) {
            itemToDisplay = _spread.validItems()[0];
            if(itemToDisplay) {
                var paginationRequest = new ReadiumSDK.Models.PageOpenRequest(itemToDisplay, self);
                self.openPage(paginationRequest);
            }
        }
        else {
            updatePageSwitchDir(0, false);
            resizeBook(true);
        }
    };

    function isContentRendered() {

        if(!_contentMetaSize || !_bookMargins) {
            return false;
        }

        var viewportWidth = _$viewport.width();
        var viewportHeight = _$viewport.height();

        return viewportWidth && viewportHeight;
    }

    function resizeBook(viewportIsResizing) {

        if(!isContentRendered()) {
            return;
        }

        var viewportWidth = _$viewport.width();
        var viewportHeight = _$viewport.height();

        var leftPageMargins = _leftPageView.isDisplaying() ? ReadiumSDK.Helpers.Margins.fromElement(_leftPageView.element()) : ReadiumSDK.Helpers.Margins.empty();
        var rightPageMargins = _rightPageView.isDisplaying() ? ReadiumSDK.Helpers.Margins.fromElement(_rightPageView.element()) : ReadiumSDK.Helpers.Margins.empty();
        var centerPageMargins = _centerPageView.isDisplaying() ? ReadiumSDK.Helpers.Margins.fromElement(_centerPageView.element()) : ReadiumSDK.Helpers.Margins.empty();

        var pageMargins = getMaxPageMargins(leftPageMargins, rightPageMargins, centerPageMargins);

        var potentialTargetElementSize = {   width: viewportWidth - _bookMargins.width(),
                                             height: viewportHeight - _bookMargins.height()};

        var potentialContentSize = {    width: potentialTargetElementSize.width - pageMargins.width(),
                                        height: potentialTargetElementSize.height - pageMargins.height() };

        if(potentialTargetElementSize.width <= 0 || potentialTargetElementSize.height <= 0) {
            return;
        }

        var horScale = potentialContentSize.width / _contentMetaSize.width;
        var verScale = potentialContentSize.height / _contentMetaSize.height;

        var scale = Math.min(horScale, verScale);

        var contentSize = { width: _contentMetaSize.width * scale,
                            height: _contentMetaSize.height * scale };

        var targetElementSize = {   width: contentSize.width + pageMargins.width(),
                                    height: contentSize.height + pageMargins.height() };

        var bookSize = {    width: targetElementSize.width + _bookMargins.width(),
                            height: targetElementSize.height + _bookMargins.height() };


        var bookLeft = Math.floor((viewportWidth - bookSize.width) / 2);
        var bookTop = Math.floor((viewportHeight - bookSize.height) / 2);

        if(bookLeft < 0) bookLeft = 0;
        if(bookTop < 0) bookTop = 0;
        
        _$el.css("left", bookLeft + "px");
        _$el.css("top", bookTop + "px");
        _$el.css("width", targetElementSize.width + "px");
        _$el.css("height", targetElementSize.height + "px");

        var left = _bookMargins.padding.left;
        var top = _bookMargins.padding.top;

        var transFunc = viewportIsResizing ? "transformContentImmediate" : "transformContent";

        if(_leftPageView.isDisplaying()) {

             _leftPageView[transFunc](scale, left, top);
        }

        if(_rightPageView.isDisplaying()) {

            left += _contentMetaSize.separatorPosition * scale;

            if(_leftPageView.isDisplaying()) {
                left += leftPageMargins.left;
            }

            _rightPageView[transFunc](scale, left, top);
        }

        if(_centerPageView.isDisplaying()) {

            _centerPageView[transFunc](scale, left, top);
        }
    }

    function getMaxPageMargins(leftPageMargins, rightPageMargins, centerPageMargins) {

         var sumMargin = {
            left: Math.max(leftPageMargins.margin.left, rightPageMargins.margin.left, centerPageMargins.margin.left),
            right: Math.max(leftPageMargins.margin.right, rightPageMargins.margin.right, centerPageMargins.margin.right),
            top: Math.max(leftPageMargins.margin.top, rightPageMargins.margin.top, centerPageMargins.margin.top),
            bottom: Math.max(leftPageMargins.margin.bottom, rightPageMargins.margin.bottom, centerPageMargins.margin.bottom)
        };

        var sumBorder = {
            left: Math.max(leftPageMargins.border.left, rightPageMargins.border.left, centerPageMargins.border.left),
            right: Math.max(leftPageMargins.border.right, rightPageMargins.border.right, centerPageMargins.border.right),
            top: Math.max(leftPageMargins.border.top, rightPageMargins.border.top, centerPageMargins.border.top),
            bottom: Math.max(leftPageMargins.border.bottom, rightPageMargins.border.bottom, centerPageMargins.border.bottom)
        };

        var sumPAdding = {
            left: Math.max(leftPageMargins.padding.left, rightPageMargins.padding.left, centerPageMargins.padding.left),
            right: Math.max(leftPageMargins.padding.right, rightPageMargins.padding.right, centerPageMargins.padding.right),
            top: Math.max(leftPageMargins.padding.top, rightPageMargins.padding.top, centerPageMargins.padding.top),
            bottom: Math.max(leftPageMargins.padding.bottom, rightPageMargins.padding.bottom, centerPageMargins.padding.bottom)
        };

        return new ReadiumSDK.Helpers.Margins(sumMargin, sumBorder, sumPAdding);

    }

    function updateContentMetaSize() {

        _contentMetaSize = {};

        if(_centerPageView.isDisplaying()) {
            _contentMetaSize.width = _centerPageView.meta_width();
            _contentMetaSize.height = _centerPageView.meta_height();
            _contentMetaSize.separatorPosition = 0;
        }
        else if(_leftPageView.isDisplaying() && _rightPageView.isDisplaying()) {
            if(_leftPageView.meta_height() == _rightPageView.meta_height()) {
                _contentMetaSize.width = _leftPageView.meta_width() + _rightPageView.meta_width();
                _contentMetaSize.height = _leftPageView.meta_height();
                _contentMetaSize.separatorPosition = _leftPageView.meta_width();
            }
            else {
                //normalize by height
                _contentMetaSize.width = _leftPageView.meta_width() + _rightPageView.meta_width() * (_leftPageView.meta_height() / _rightPageView.meta_height());
                _contentMetaSize.height = _leftPageView.meta_height();
                _contentMetaSize.separatorPosition = _leftPageView.meta_width();
            }
        }
        else if(_leftPageView.isDisplaying()) {
            _contentMetaSize.width = _leftPageView.meta_width() * 2;
            _contentMetaSize.height = _leftPageView.meta_height();
            _contentMetaSize.separatorPosition = _leftPageView.meta_width();
        }
        else if(_rightPageView.isDisplaying()) {
            _contentMetaSize.width = _rightPageView.meta_width() * 2;
            _contentMetaSize.height = _rightPageView.meta_height();
            _contentMetaSize.separatorPosition = _rightPageView.meta_width();
        }
        else {
            _contentMetaSize = undefined;
        }

    }

    function updateBookMargins() {
        _bookMargins = ReadiumSDK.Helpers.Margins.fromElement(_$el);
    }

    this.openPage =  function(paginationRequest, dir) {

        if(!paginationRequest.spineItem) {
            return;
        }

        var leftItem = _spread.leftItem;
        var rightItem = _spread.rightItem;
        var centerItem = _spread.centerItem;
        
        _spread.openItem(paginationRequest.spineItem);
        
        var hasChanged = leftItem !== _spread.leftItem || rightItem !== _spread.rightItem || centerItem !== _spread.centerItem;
        updatePageSwitchDir(dir === 0 ? 0 : (_spread.spine.isRightToLeft() ? (dir === 1 ? 2 : 1) : dir), hasChanged);
        
        redraw(paginationRequest.initiator, paginationRequest);
    };


    this.openPagePrev = function(initiator) {

        _spread.openPrev();
        updatePageSwitchDir(_spread.spine.isRightToLeft() ? 2 : 1, true);
        redraw(initiator, undefined);
    };

    this.openPageNext = function(initiator) {

        _spread.openNext();
        updatePageSwitchDir(_spread.spine.isRightToLeft() ? 1 : 2, true);
        redraw(initiator, undefined);
    };

    function updatePageViewForItem(pageView, item, context) {

        if(!item) {
            if(pageView.isDisplaying()) {
                pageView.remove();
            }

            return undefined;
        }

        if(!pageView.isDisplaying()) {

            _$el.append(pageView.render().element());

            context.isElementAdded = true;
        }

        var dfd = $.Deferred();

        pageView.loadSpineItem(item, function(success, $iframe, spineItem, isNewContentDocumentLoaded, context){

            if(success && isNewContentDocumentLoaded) {

                //if we a re loading fixed view meta size should be defined
                if(!pageView.meta_height() || !pageView.meta_width()) {
                    console.error("Invalid document " + spineItem.href + ": viewport is not specified!");
                }

                self.trigger(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, $iframe, spineItem);
            }

            dfd.resolve();

        }, context);

        return dfd.promise();

    }

    this.getPaginationInfo = function() {

        var paginationInfo = new ReadiumSDK.Models.CurrentPagesInfo(_spine.items.length, true, _spine.direction);

        var spreadItems = [_spread.leftItem, _spread.rightItem, _spread.centerItem];

        for(var i = 0; i < spreadItems.length; i++) {

            var spreadItem = spreadItems[i];

            if(spreadItem) {
                paginationInfo.addOpenPage(0, 1, spreadItem.idref, spreadItem.index);
            }
        }

        return paginationInfo;
    };

    this.bookmarkCurrentPage = function() {

        var views = getDisplayingViews();

        if(views.length > 0) {

            var idref = views[0].currentSpineItem().idref;
            var cfi = views[0].getFirstVisibleElementCfi();

            if(cfi == undefined) {
                cfi = "";
            }

            return new ReadiumSDK.Models.BookmarkData(idref, cfi);
        }

        return new ReadiumSDK.Models.BookmarkData("", "");
    };

    function getDisplayingViews() {

        var viewsToCheck = [];

        if( _spine.isLeftToRight() ) {
            viewsToCheck = [_leftPageView, _centerPageView, _rightPageView];
        }
        else {
            viewsToCheck = [_rightPageView, _centerPageView, _leftPageView];
        }

        var views = [];

        for(var i = 0, count = viewsToCheck.length; i < count; i++) {
            if(viewsToCheck[i].isDisplaying()) {
                views.push(viewsToCheck[i]);
            }
        }

        return views;
    }

    this.getLoadedSpineItems = function() {

        return _spread.validItems();
    };

    this.getElement = function(spineItem, selector) {

        var views = getDisplayingViews();

        for(var i = 0, count = views.length; i < count; i++) {

            var view = views[i];
            if(view.currentSpineItem() == spineItem) {
                return view.getElement(spineItem, selector);
            }
        }

        console.error("spine item is not loaded");
        return undefined;
    };

    this.getElementById = function(spineItem, id) {

        var views = getDisplayingViews();

        for(var i = 0, count = views.length; i < count; i++) {

            var view = views[i];
            if(view.currentSpineItem() == spineItem) {
                return view.getElementById(spineItem, id);
            }
        }

        console.error("spine item is not loaded");
        return undefined;
    };

    this.getElementByCfi = function(spineItem, cfi, classBlacklist, elementBlacklist, idBlacklist) {

        var views = getDisplayingViews();

        for(var i = 0, count = views.length; i < count; i++) {

            var view = views[i];
            if(view.currentSpineItem() == spineItem) {
                return view.getElementByCfi(spineItem, cfi, classBlacklist, elementBlacklist, idBlacklist);
            }
        }

        console.error("spine item is not loaded");
        return undefined;
    };

    this.getFirstVisibleMediaOverlayElement = function() {

        var views = getDisplayingViews();

        for(var i = 0, count = views.length; i < count; i++) {
            var el = views[i].getFirstVisibleMediaOverlayElement();
            if (el) return el;
        }

        return undefined;
    };

    this.insureElementVisibility = function(spineItemId, element, initiator) {

        //for now we assume that for fixed layout element is always visible

    }

};
