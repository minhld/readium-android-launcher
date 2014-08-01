package com.example.test38;

import java.util.ArrayList;
import java.util.List;

import org.json.JSONException;
import org.readium.sdk.android.Container;
import org.readium.sdk.android.Package;
import org.readium.sdk.android.SpineItem;

import android.support.v7.app.ActionBarActivity;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ListView;
import android.content.Intent;
import android.os.Bundle;

public class PageListActivity extends ActionBarActivity {
	final String TAG="PageListActivity";
	
	private ListView pageList;
	private Package pkg;
	private long containerId;
	private List<SpineItem> spineItems;
	
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_page_list);
		pageList=(ListView)findViewById(R.id.bookPagesList);
		
		openPageList();
	}

	private void openPageList(){
		Intent intent=getIntent();
		if (intent.getFlags() == Intent.FLAG_ACTIVITY_NEW_TASK) {
            Bundle extras = intent.getExtras();
            if (extras != null) {
                containerId = extras.getLong(Constants.CONTAINER_ID);
                Container container = ContainerHolder.getInstance().get(containerId);
                if (container == null) {
                	finish();
                	return;
                }
                pkg = container.getDefaultPackage();
            }
        }
		ItemListAdapter adapter=new ItemListAdapter(this,getItemList());
		pageList.setAdapter(adapter);
		pageList.setOnItemClickListener(new AdapterView.OnItemClickListener() {
			@Override
			public void onItemClick(AdapterView<?> parent, View view,
					int position, long id) {
				openPage(position);
			}
		});
	}
	
	private List<String> getItemList(){
		List<String> list=new ArrayList<String>();
		spineItems=pkg.getSpineItems();
		for (SpineItem item:spineItems){
			list.add(item.getIdRef());
		}
		return list;
	}
	
	private void openPage(int pos){
		
		Intent intent = new Intent(this, ViewerActivity2.class);
//		Intent intent = new Intent(this, ViewerActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
		intent.putExtra(Constants.CONTAINER_ID, containerId);

		OpenPageRequest openPageRequest = OpenPageRequest.fromIdref(spineItems.get(pos).getIdRef());
		try {
			intent.putExtra(Constants.OPEN_PAGE_REQUEST_DATA, openPageRequest.toJSON().toString());
    		startActivity(intent);
		} catch (JSONException e) {
			Log.e(TAG, ""+e.getMessage(), e);
		}
	}
}
