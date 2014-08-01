package com.example.test38;


import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;

import org.json.JSONException;
import org.readium.sdk.android.Container;
import org.readium.sdk.android.ManifestItem;
import org.readium.sdk.android.Package;

import android.support.v7.app.ActionBarActivity;
import android.text.format.Formatter;
import android.util.Log;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;

@SuppressWarnings("deprecation")
@SuppressLint("SetJavaScriptEnabled")
public class ViewerActivity2 extends ActionBarActivity {
	final String TAG="ViewerActivity";
//	final String ASSET_PREFIX = "file:///android_asset/mobread/";
//	final String READER_MAIN = "file:///android_asset/mobread/index.html";
	final String ASSET_PREFIX = "file:///android_asset/readium-shared-js/";
	final String READER_MAIN = "file:///android_asset/readium-shared-js/reader.html";
	final String READER_DENOTE="readium-shared-js/reader.html";
	
	final String HOST="localhost";
	final int PORT=8080;
	
	Container mContainer;
	Package mPackage;
	ReadiumJSApi mReadiumJSApi;
	OpenPageRequest mOpenPageRequestData;
	ViewerSettings mViewerSettings;
	
	EpubServer2 mServer;
	WebView mWebview;
	
	String basePath;
	
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_viewer);
		mWebview = (WebView) findViewById(R.id.viewer);
		initWebView();
		
		startViewer();
	}
	
	@Override
	protected void onPause() {
		super.onPause();
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
			mWebview.onPause();
		}
	}
	
	@Override
	protected void onResume() {
		super.onResume();
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
			mWebview.onResume();
		}
	}
	
	@Override
	protected void onDestroy() {
		super.onDestroy();
		mServer.stop();
        // fun!
		((ViewGroup) mWebview.getParent()).removeView(mWebview);
		mWebview.removeAllViews();
		mWebview.clearCache(true);
		mWebview.clearHistory();
		mWebview.destroy();
	}
	
	private void startViewer(){
		// 0
		
		
		// 1.
		Intent intent = getIntent();
        if (intent.getFlags() == Intent.FLAG_ACTIVITY_NEW_TASK) {
            Bundle extras = intent.getExtras();
            if (extras != null) {
                mContainer = ContainerHolder.getInstance().get(extras.getLong(Constants.CONTAINER_ID));
                if (mContainer == null) {
                	finish();
                	return;
                }
                mPackage = mContainer.getDefaultPackage();
                try {
					mOpenPageRequestData = OpenPageRequest.fromJSON(extras.getString(Constants.OPEN_PAGE_REQUEST_DATA));
				} catch (JSONException e) {
					Log.e(TAG, "Constants.OPEN_PAGE_REQUEST_DATA must be a valid JSON object: "+e.getMessage(), e);
				}
                
                
                //
                basePath=mPackage.getBasePath().replaceFirst("file://", "");
            }
        }
        
        // 2.
        
//		WifiManager WiMan = (WifiManager)getSystemService(Context.WIFI_SERVICE);
//        WifiInfo wifiInfo = WiMan.getConnectionInfo();
//        int address = wifiInfo.getIpAddress();
//        final String ipAddress = Formatter.formatIpAddress(address);

        new AsyncTask<Void, Integer, Void>() {
			@Override
			protected Void doInBackground(Void... params) {

        		mServer = new EpubServer2(ViewerActivity2.this, 
        				HOST, PORT, mPackage, false);
    			mServer.startServer();
    			
    			publishProgress(0);
    			return null;
        	}
			
			protected void onProgressUpdate(Integer[] values) {
		        // 3.
		        mWebview.loadUrl(getUrl(READER_MAIN,HOST));
		        mViewerSettings = new ViewerSettings(false, 100, 20);
		        mReadiumJSApi = new ReadiumJSApi(new ReadiumJSApi.JSLoader() {
					
					@Override
					public void loadJS(String javascript) {
						mWebview.loadUrl(javascript);
					}
				});
			}
        }.execute();
        
        // 3.
//        mWebview.loadUrl(getUrl(READER_MAIN,HOST));
////        mWebview.loadUrl(READER_MAIN);
//        mViewerSettings = new ViewerSettings(false, 100, 20);
//        mReadiumJSApi = new ReadiumJSApi(new ReadiumJSApi.JSLoader() {
//			
//			@Override
//			public void loadJS(String javascript) {
//				mWebview.loadUrl(javascript);
//			}
//		});

	}

	private void initWebView(){
		mWebview.getSettings().setJavaScriptEnabled(true);
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
			mWebview.getSettings().setAllowUniversalAccessFromFileURLs(true);
		}
		mWebview.setWebViewClient(new EpubWebViewClient());
//		mWebview.setWebChromeClient(new EpubWebChromeClient());
//
		mWebview.addJavascriptInterface(new EpubInterface(), "LauncherUI");

	}

	public final class EpubWebViewClient extends WebViewClient {

        private static final String HTTP = "http";
		private static final String UTF_8 = "utf-8";
        private boolean skeletonPageLoaded = false;

		@Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
        	Log.d(TAG, "onPageStarted: "+url);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
        	Log.d(TAG, "onPageFinished: "+url);
//        	if (!skeletonPageLoaded && url.equals(READER_MAIN)) {
        	if (!skeletonPageLoaded && url.contains(READER_DENOTE)) {
        		skeletonPageLoaded = true;
        		Log.d(TAG, "openPageRequestData: "+mOpenPageRequestData);
        		mReadiumJSApi.openBook(mPackage, mViewerSettings, mOpenPageRequestData);
        	}
        }

//        @Override
//        public void onLoadResource(WebView view, String url) {
//			Log.d(TAG, "onLoadResource: " + url);
//			if (!url.contains(basePath)){
//				return;
//			}
//			
//        	String cleanedUrl = cleanResourceUrl(url);
//        	byte[] data = mPackage.getContent(cleanedUrl);
//            if (data != null && data.length > 0) {
//            	ManifestItem item = mPackage.getManifestItem(cleanedUrl);
//            	String mimetype = (item != null) ? item.getMediaType() : null;
//            	mWebview.loadData(new String(data), mimetype, UTF_8);
//            }
//        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
			Log.d(TAG, "shouldOverrideUrlLoading: " + url);
    		return false;
        }

//        @Override
//        public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
//			Log.d(TAG, "shouldInterceptRequest: " + url);
//			Uri uri = Uri.parse(url);
//            if (uri.getScheme().equals("file")) {
//                String cleanedUrl = cleanResourceUrl(url);
//                Log.d(TAG, url+" => "+cleanedUrl);
//                InputStream data = mPackage.getInputStream(cleanedUrl);
//                ManifestItem item = mPackage.getManifestItem(cleanedUrl);
//                if (item != null && item.isHtml()) {
//                    byte[] binary;
//                    try {
//                        binary = new byte[data.available()];
//                        data.read(binary);
//                        data.close();
//                        data = new ByteArrayInputStream(HTMLUtil.htmlByReplacingMediaURLsInHTML(new String(binary),
//                                cleanedUrl, "PackageUUID").getBytes());
//                    } catch (IOException e) {
//                        Log.e(TAG, ""+e.getMessage(), e);
//                    }
//                }
//                String mimetype = (item != null) ? item.getMediaType() : null;
//                return new WebResourceResponse(mimetype, UTF_8, data);
//            } else if(uri.getScheme().equals("http")){
//            	return super.shouldInterceptRequest(view, url);
//            }
//
//            try {
//                URLConnection c = new URL(url).openConnection();
//                return new WebResourceResponse(null, UTF_8, c.getInputStream());
//            } catch (MalformedURLException e) {
//                Log.e(TAG, ""+e.getMessage(), e);
//            } catch (IOException e) {
//                Log.e(TAG, ""+e.getMessage(), e);
//            }
//            return new WebResourceResponse(null, UTF_8, new ByteArrayInputStream("".getBytes()));
//        }
    }
	
	public class EpubInterface {
		
		@JavascriptInterface
		public void onPaginationChanged(String currentPagesInfo) {
			Log.d(TAG, "onPaginationChanged: "+currentPagesInfo);
//			try {
//				PaginationInfo paginationInfo = PaginationInfo.fromJson(currentPagesInfo);
//				List<Page> openPages = paginationInfo.getOpenPages();
//				if (!openPages.isEmpty()) {
//					final Page page = openPages.get(0);
//					runOnUiThread(new Runnable() {
//						public void run() {
//							mPageInfo.setText(getString(R.string.page_x_of_y,
//									page.getSpineItemPageIndex() + 1,
//									page.getSpineItemPageCount()));
//							SpineItem spineItem = mPackage.getSpineItem(page.getIdref());
//							boolean isFixedLayout = spineItem.isFixedLayout();
//				            mWebview.getSettings().setBuiltInZoomControls(isFixedLayout);
//				            mWebview.getSettings().setDisplayZoomControls(false);
//						}
//					});
//				}
//			} catch (JSONException e) {
//				Log.e(TAG, ""+e.getMessage(), e);
//			}
		}
		
		@JavascriptInterface
		public void onSettingsApplied() {
			Log.d(TAG, "onSettingsApplied");
		}
		
		@JavascriptInterface
		public void onReaderInitialized() {
			Log.d(TAG, "onReaderInitialized");
		}
		
		@JavascriptInterface
		public void onContentLoaded() {
			Log.d(TAG, "onContentLoaded");
		}
		
		@JavascriptInterface
		public void onPageLoaded() {
			Log.d(TAG, "onPageLoaded");
		}
		
		@JavascriptInterface
		public void onIsMediaOverlayAvailable(String available){
			Log.d(TAG, "onIsMediaOverlayAvailable:" + available);
//			mIsMoAvailable = available.equals("true");
//            
//            runOnUiThread(new Runnable()
//            {
//                @Override
//                public void run()
//                {
//                    invalidateOptionsMenu();
//                }
//            });
		}
		
		@JavascriptInterface
		public void onMediaOverlayStatusChanged(String status) {
			Log.d(TAG, "onMediaOverlayStatusChanged:" + status);
			//this should be real json parsing if there will be more data that needs to be extracted
			
//			if(status.indexOf("isPlaying") > -1){
//				mIsMoPlaying = status.indexOf("\"isPlaying\":true") > -1;
//			}
//            
//            runOnUiThread(new Runnable()
//            {
//                @Override
//                public void run()
//                {
//                    invalidateOptionsMenu();
//                }
//            });
		}
//		
//		@JavascriptInterface
//		public void onMediaOverlayTTSSpeak() {
//			Log.d(TAG, "onMediaOverlayTTSSpeak");
//		}
//		
//		@JavascriptInterface
//		public void onMediaOverlayTTSStop() {
//			Log.d(TAG, "onMediaOverlayTTSStop");
//		}
		
		@JavascriptInterface
		public void getBookmarkData(final String bookmarkData) {
//			AlertDialog.Builder builder = new AlertDialog.Builder(WebViewActivity.this).
//					setTitle(R.string.add_bookmark);
//	        
//	        final EditText editText = new EditText(WebViewActivity.this);
//	        editText.setId(android.R.id.edit);
//	        editText.setHint(R.string.title);
//	        builder.setView(editText);
//	        builder.setPositiveButton(android.R.string.ok, new DialogInterface.OnClickListener() {
//				
//				@Override
//				public void onClick(DialogInterface dialog, int which) {
//					if (which == DialogInterface.BUTTON_POSITIVE) {
//						String title = editText.getText().toString();
//						try {
//							JSONObject bookmarkJson = new JSONObject(bookmarkData);
//							BookmarkDatabase.getInstance().addBookmark(mContainer.getName(), title,
//									bookmarkJson.getString("idref"), bookmarkJson.getString("contentCFI"));
//						} catch (JSONException e) {
//							Log.e(TAG, ""+e.getMessage(), e);
//						}
//					}
//				}
//			});
//	        builder.setNegativeButton(android.R.string.cancel, null);
//	        builder.show();
		}
	}
	
	private String getUrl(String path,String ipAddr){
		if (path.startsWith(Constants.FILE_PROC)){
			return Constants.HTTP_PROC+ipAddr+":"+PORT+
					path.replace(Constants.FILE_PROC,"");
		}else if (path.startsWith("/")){
			return Constants.HTTP_PROC+ipAddr+":"+PORT+path;
		}
		return "";
	}
	
	private String cleanResourceUrl(String url) {
		// Clean assets prefix
		int startUseOffs = url.lastIndexOf(basePath) + basePath.length();
		String cleanUrl = url.substring(startUseOffs);
		// Clean anything after sharp
		int indexOfSharp = cleanUrl.indexOf('#');
        if (indexOfSharp >= 0) {
            cleanUrl = cleanUrl.substring(0, indexOfSharp);
        }
        return cleanUrl;
    }
}
