package com.example.test38;

import java.util.Date;

import org.readium.sdk.android.Container;
import org.readium.sdk.android.EPub3;
import org.readium.sdk.android.Package;

import android.support.v7.app.ActionBarActivity;
import android.view.View;
import android.widget.TextView;
import android.content.Intent;
import android.os.Bundle;
import android.os.Environment;

public class MainActivity extends ActionBarActivity {
	private Container container;
	private TextView bookInfoText;
	
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_main);
		bookInfoText=(TextView)findViewById(R.id.bookInfo);
		findViewById(R.id.openBook).setOnClickListener(new View.OnClickListener(){
			@Override
			public void onClick(View v) {
				Intent intent=new Intent(MainActivity.this,PageListActivity.class);
				intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
				intent.putExtra(Constants.CONTAINER_ID, container.getNativePtr());
				startActivity(intent);
			}
		});
		loadBook();
	}
	
	@Override
	protected void onDestroy() {
		super.onDestroy();
		
		removeBook();
	}
	
	private void loadBook(){
		String path=Environment.getExternalStorageDirectory().getAbsolutePath()+
				"/epubtest/yuzu.epub";
		
		long startTime=new Date().getTime();
		
		if (EPub3.isEpub3Book(path)){
			// open container
			container=EPub3.openBook(path);
			ContainerHolder.getInstance().put(container.getNativePtr(),container);
			
			// book info
			Package pkg=container.getDefaultPackage();
			String bookInfoStr="title: "+pkg.getTitle()+Constants.LINEBREAK+
								"author: "+pkg.getAuthors()+Constants.LINEBREAK;
			bookInfoText.setText(bookInfoStr);
			
			
			
		}
		
		long dur=new Date().getTime()-startTime;
		bookInfoText.append("duration time: "+dur+"ms");
	}
	
	private void removeBook(){
		if (container != null) {
    		ContainerHolder.getInstance().remove(container.getNativePtr());
    		EPub3.closeBook(container);
    	}
	}
}
