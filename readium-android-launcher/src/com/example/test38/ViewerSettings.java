//  Copyright (c) 2014 Readium Foundation and/or its licensees. All rights reserved.
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
//  OF THE POSSIBILITY OF SUCH DAMAGE

package com.example.test38;

import org.json.JSONException;
import org.json.JSONObject;

public class ViewerSettings {

    private final boolean mIsSyntheticSpread;
    private final int mFontSize;
    private final int mColumnGap;
    
	public ViewerSettings(boolean isSyntheticSpread, int fontSize, int columnGap) {
		mIsSyntheticSpread = isSyntheticSpread;
		mFontSize = fontSize;
		mColumnGap = columnGap;
	}

	public boolean isSyntheticSpread() {
		return mIsSyntheticSpread;
	}

	public int getFontSize() {
		return mFontSize;
	}

	public int getColumnGap() {
		return mColumnGap;
	}
	
	public JSONObject toJSON() throws JSONException {
		JSONObject json = new JSONObject();
		json.put("isSyntheticSpread", mIsSyntheticSpread);
		json.put("fontSize", mFontSize);
		json.put("columnGap", mColumnGap);
		return json;
	}

	@Override
	public String toString() {
		return "ViewerSettings [isSyntheticSpread=" + mIsSyntheticSpread
				+ ", fontSize=" + mFontSize + ", columnGap=" + mColumnGap
				+ "]";
	}
	
	
}
