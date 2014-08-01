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
 *
 * @class ReadiumSDK.Models.Package
 */

ReadiumSDK.Models.Package = function(packageData){

    var self = this;

    this.spine = undefined;
    
    this.rootUrl = undefined;
    this.rootUrlMO = undefined;
    
    this.media_overlay = undefined;
    
    this.rendition_flow = undefined;
    
    this.rendition_layout = undefined;

    //TODO: unused yet!
    this.rendition_spread = undefined;

    //TODO: unused yet!
    this.rendition_orientation = undefined;

    this.resolveRelativeUrlMO = function(relativeUrl) {

        if(self.rootUrlMO && self.rootUrlMO.length > 0) {

            if(ReadiumSDK.Helpers.EndsWith(self.rootUrlMO, "/")){
                return self.rootUrlMO + relativeUrl;
            }
            else {
                return self.rootUrlMO + "/" + relativeUrl;
            }
        }

        return self.resolveRelativeUrl(relativeUrl);
    };

    this.resolveRelativeUrl = function(relativeUrl) {

        if(self.rootUrl) {

            if(ReadiumSDK.Helpers.EndsWith(self.rootUrl, "/")){
                return self.rootUrl + relativeUrl;
            }
            else {
                return self.rootUrl + "/" + relativeUrl;
            }
        }

        return relativeUrl;
    };

    this.isFixedLayout = function() {
        return self.rendition_layout === ReadiumSDK.Models.SpineItem.RENDITION_LAYOUT_PREPAGINATED;
    };

    this.isReflowable = function() {
        return !self.isFixedLayout();
    };
    

    if(packageData) {
        
        this.rootUrl = packageData.rootUrl;
        this.rootUrlMO = packageData.rootUrlMO;

        this.rendition_layout = packageData.rendition_layout;

        this.rendition_flow = packageData.rendition_flow;
        this.rendition_orientation = packageData.rendition_orientation;
        this.rendition_spread = packageData.rendition_spread;
        
        this.spine = new ReadiumSDK.Models.Spine(this, packageData.spine);

        this.media_overlay = ReadiumSDK.Models.MediaOverlay.fromDTO(packageData.media_overlay, this);
    }
};
