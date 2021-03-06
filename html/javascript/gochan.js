var $jq = jQuery.noConflict();

var down_arrow_symbol = "&#9660;";
var up_arrow_symbol = "&#9650;";
var board;
var topbar;
var settings_menu;
var staff_btn;
var watched_threads_btn;
var settings_arr = [];
var current_staff;
var lightbox_css_added = false;
var dropdown_div_created = false;
var qr_enabled = false;

var movable_postpreviews = true;
var expandable_postrefs = true;

function preparePostPreviews(is_inline) {
	var m_type = "mousemove";
	if(!movable_postpreviews) m_type = "mouseover";
	if(expandable_postrefs) $("a.postref").attr("href","javascript:void(0);");
	var hvr_str = "a.postref";
	if(is_inline) hvr_str = "div.inlinepostprev "+hvr_str;
	$(hvr_str).hover(function(){
		$(document.body).append($("div#"+this.innerHTML.replace("&gt;&gt;","")).clone().attr("class","postprev"))
		$(document).bind(m_type, function(e){
		    $('.postprev').css({
		       left:  e.pageX + 8,
		       top:   e.pageY + 8
		    });
		})
	},
	function() {
		$(".postprev").remove();
	});

	if(expandable_postrefs) {
		var clk_str = "a.postref";
		if(is_inline) clk_str = "div.inlinepostprev "+clk_str;
		$(clk_str).click(function() {
			if($(this).next().attr("class") != "inlinepostprev") {
				$(".postprev").remove();
				$(this).after($("div#"+this.innerHTML.replace("&gt;&gt;","")).clone().attr({"class":"inlinepostprev","id":"i"+$(this).parent().attr("id")+"-"+($(this).parent().find("div#i"+$(this).parent().attr("id")).length+1)}));
				preparePostPreviews(true);
			} else {
				$(this).next().remove();
			}
		});
	}
}

function getUploadPostID(upload, container) {
	// if container, upload is div.upload-container
	// otherwise it's img or video
	var jqu = container? $jq(upload) : $jq(upload).parent();
	if(insideOP(jqu)) return jqu.siblings().eq(4).text();
	else return jqu.siblings().eq(3).text();
}

function insideOP(elem) {
	return $jq(elem).parents("div.op-post").length > 0;
}

function prepareThumbnails() {
	// set thumbnails to expand when clicked
	$jq("a.upload-container").click(function(e) {
		var a = $jq(this);
		var thumb = a.find("img.upload");
		var video;
		var thumbURL;
		if(thumb.attr("alt") == undefined) thumbURL = thumb.attr("src");
		else thumbURL = thumb.attr("alt");
		var thumb_width = thumb.attr("width");
		var thumb_height = thumb.attr("height");
		var file_info_elem = a.prevAll(".file-info:first");
		var uploadURL = file_info_elem.children("a:first")[0].href;
		var viewBtn = a.nextAll("span.post-links:first");
		if(thumb.attr("src") == thumbURL) {
			// Expanding thumbnail
			if(uploadURL.indexOf(".webm") > 0) {
				// Upload is a video
				thumb.hide();
				video = $jq("<video />")
				.prop({
					src: uploadURL,
					autoplay: true,
					controls: true,
					class: "upload",
					loop: true
				}).insertAfter(file_info_elem);

				var close_video_btn = $jq("<a />")
				.prop("href", "javascript:;")
				.click(function(e) {
					video.remove();
					thumb.show();
					this.remove();
				}).css({
					"padding-left": "8px"
				})
				.html("[Close]<br />");
				file_info_elem.append(close_video_btn);
			} else {
				thumb.attr({
					src: uploadURL,
					alt: thumbURL
				})
				.removeAttr("width")
				.removeAttr("height");
			}
		} else {
			// Shrinking back to thumbnail
			thumb.attr({
				"src": thumbURL,
				"width": thumb_width,
				"height": thumb_height
			});
		}
		return false;
	});
}

var TopBarButton = function(title,callback_open, callback_close) {
	this.title = title;
	$jq("div#topbar").append("<a href=\"javascript:void(0)\" class=\"dropdown-button\" id=\""+title.toLowerCase()+"\">"+title+down_arrow_symbol+"</a>");
	var button_open = false;

	$jq("div#topbar a#"+title.toLowerCase()).click(function(event) {
		if(!button_open) {
			callback_open();
			if(callback_close != null) {
				$jq(document).bind("click", function() {
					callback_close();
				});
				button_open = true;
			}
		} else {
			if(callback_close != null) {
				callback_close();
			}
			button_open	= false;
		}
		return false;
	});
}

var DropDownMenu = function(title,menu_html) {
	this.title = title;
	this.menuHTML = menu_html;
	this.button = new TopBarButton(title, function() {
		topbar.after("<div id=\""+title.toLowerCase()+"\" class=\"dropdown-menu\">"+menu_html+"</div>");
		$jq("a#"+title.toLowerCase() + "-menu").children(0).html(title+up_arrow_symbol);
		$jq("div#"+title.toLowerCase()).css({
			top:topbar.height()
		});
	}, function() {
		$jq("div#"+title.toLowerCase() + ".dropdown-menu").remove();
		$jq("a#"+title.toLowerCase() + "-menu").children(0).html(title+down_arrow_symbol);
	});
}

function showLightBox(title,innerHTML) {
	if(!lightbox_css_added) {
		$jq(document).find("head").append("\t<link rel=\"stylesheet\" href=\"/css/lightbox.css\" />");
		lightbox_css_added = true;
	}
	$jq(document.body).prepend("<div class=\"lightbox-bg\"></div><div class=\"lightbox\"><div class=\"lightbox-title\">"+title+"<a href=\"#\" class=\"lightbox-x\">X</a><hr /></div>"+innerHTML+"</div>");
	$jq("a.lightbox-x").click(function() {
		$jq(".lightbox").remove();
		$jq(".lightbox-bg").remove();
	});
	$jq(".lightbox-bg").click(function() {
		$jq(".lightbox").remove();
		$jq(".lightbox-bg").remove();
	});
}

// opens up a lightbox for use as a message box that will look the same on all browsers
function showMessage(msg) {
	if(!lightbox_css_added) {
		$jq(document).find("head").append("\t<link rel=\"stylesheet\" href=\"/css/lightbox.css\" />");
		lightbox_css_added = true;
	}
	$jq(document.body).prepend("<div class=\"lightbox-bg\"></div><div class=\"lightbox-msg\">"+msg+"<br /><button class=\"lightbox-msg-ok\" style=\"float: right; margin-top:8px;\">OK</button></div>");
	console.log($jq(".lightbox-msg").width());
	var centeroffset = parseInt($jq(".lightbox-msg").css("transform-origin").replace("px",""),10)+$jq(".lightbox-msg").width()/2
	
	$jq(".lightbox-msg").css({
		"position": "fixed",
		"left": $jq(document).width()/2 - centeroffset/2-16
	});

	$jq(".lightbox-msg-ok").click(function() {
		$jq(".lightbox-msg").remove();
		$jq(".lightbox-bg").remove();
	});
	$jq(".lightbox-bg").click(function() {
		$jq(".lightbox-msg").remove();
		$jq(".lightbox-bg").remove();
	});
}

// organize front page into tabs
function changeFrontPage(page_name) {
	var tabs = $jq(".tab");
	var pages = $jq(".page");
	var current_page = getHashVal();
	pages.hide();
	if(current_page=="") {
		$jq(pages[0]).show();
	} else {
		for(var p = 0; p < pages.length; p++) {
			var page = $jq(pages[p]);
			if(page.attr("id").replace("-page","").replace("page","") == current_page) {
				page.show()
			}
		}
	}

	for(var i = 0; i < tabs.length; i++) {
		var child = $jq(tabs[i]).children(0)
		var tabname = child.text();
		if(tabname.toLowerCase() == current_page) {
			$jq("#current-tab").attr({"id":""});
			child.parent().attr({"id":"current-tab"});
		}
	}

	tabs.find("a").click(function(event) {
		current_page = getHashVal($jq(this).attr("href"));

		if(current_page == "") {
			$jq("#current-tab").attr({"id":""});
			$jq(tabs[0]).attr({"id":"current-tab"});
		} else {
			for(var i = 0; i < tabs.length; i++) {
				var child = $jq(tabs[i]).children(0)
				var tabname = child.text();
				if(tabname.toLowerCase() == current_page) {
					$jq("#current-tab").attr({"id":""});
					$jq(tabs[i]).attr({"id":"current-tab"});
				}
			}
		}

		pages.hide()
		if(current_page=="") {
			$jq(pages[0]).show();
		} else {
			for(var p = 0; p < pages.length; p++) {
				var page = $jq(pages[p]);
				if(page.attr("id").replace("-page","").replace("page","") == current_page) {
					page.show()
				}
			}
		}
	});
}


// heavily based on 4chan's quote() function, with a few tweaks
function quote(e) {
	var msgbox_id = "postmsg";
	if(qr_enabled) msgbox_id = "postmsg-qr";

	if (document.selection) {
		document.getElementById(msgbox_id).focus();
		var t = document.getselection.createRange();
		t.text = ">>" + e + "\n"
	} else if (document.getElementById(msgbox_id).selectionStart || "0" == document.getElementById(msgbox_id).selectionStart) {
		var n = document.getElementById(msgbox_id).selectionStart,
		o = document.getElementById(msgbox_id).selectionEnd;
		document.getElementById(msgbox_id).value = document.getElementById(msgbox_id).value.substring(0, n) + ">>" + e + "\n" + document.getElementById(msgbox_id).value.substring(o, document.getElementById(msgbox_id).value.length)
	} else document.getElementById(msgbox_id).value += ">>" + e + "\n"
	window.scroll(0,document.getElementById(msgbox_id).offsetTop-48);
}

function deletePost(id) {
	var password = prompt("Password (this doesn't do anything yet)");
	//window.location = webroot + "util?action=delete&posts="+id+"&board="+board+"&password";
}

function deleteCheckedPosts() {
	if(confirm('Are you sure you want to delete these posts?') == true) {
		var form = $jq("form#main-form");
		form.append("<input type=\"hidden\" name=\"action\" value=\"delete\" ");
		form.get(0).submit();
		return true;
	}
}

// returns GET argument value
function getArg(name) {
	var href = window.location.href;
	var args = href.substr(href.indexOf("?")+1, href.length);
	args = args.split("&");

	for(var i = 0; i < args.length; i++) {
		temp_args = args[i];
		temp_args = temp_args.split("=");
		temp_name = temp_args[0];
		temp_value = temp_args[1];
		args[temp_name] = temp_value;
		args[i] = temp_args;
	}
	return args[name];
}

function getHashVal() {
	var href = window.location.href;
	if(arguments.length == 1) {
		href = arguments[0];
	}
	if(href.indexOf("#") == -1) {
		return "";
	} else {
		var hash = href.substring(href.indexOf("#"),href.length);
		if(hash == "#") return ""
		else return hash.substring(1,hash.length);
	}
}

function hidePost(id) {
	var posttext = $jq("div#"+id+".post .posttext");
	if(posttext.length > 0) posttext.remove();
	var fileinfo = $jq("div#"+id+".post .file-info")
	if(fileinfo.length > 0) fileinfo.remove();
	var postimg = $jq("div#"+id+".post img")
	if(postimg.length > 0) postimg.remove();
}

// gets cookies ready to be used elsewhere
function initCookies() {
	var name_field = $jq("input#postname");
	var email_field = $jq("input#postemail");
	var password_field = $jq("input#postpassword");
	var deletepassword_field = $jq("input#delete-password");
	name_field.val(getCookie("name"));
	email_field.val(getCookie("email"));
	password_field.val(getCookie("password"));
	deletepassword_field.val(getCookie("password"));
}

function isFrontPage() {
	var page = window.location.pathname;
	return page == "/" || page == "/index.html" || page == "/template.html";
}

function setCookie(name,value) {
	document.cookie = name + "=" + escape(value)
}

function getCookie(name) {
	var cookie_arr = document.cookie.split("; ");
	for(var i = 0; i < cookie_arr.length; i++) {
		pair = cookie_arr[i].split("=");
		if(pair[0] == name) {
			return decodeURIComponent(pair[1].replace("+", " ").replace("%2B", "+"))
		}
	}
}

function reportPost(id) {
	var reason = prompt("Reason (this doesn't do anything yet)");
}

$jq(document).ready(function() {
	board = location.pathname.substring(1,location.pathname.indexOf("/",1))
	current_staff = getStaff()
	initCookies();

	topbar = $jq("div#topbar");
	var settings_html = "<table width=\"100%\"><colgroup><col span=\"1\" width=\"50%\"><col span=\"1\" width=\"50%\"></colgroup><tr><td><b>Style:</b></td><td><select name=\"style\" style=\"min-width:50%\">"
	for(var i = 0; i < styles.length; i++) {
		settings_html += "<option value=\""+styles[i]+"\">"+styles[i][0].toUpperCase()+styles[i].substring(1,styles[i].length);
	}
	settings_html+="</select></td><tr><tr><td><b>Pin top bar:</b></td><td><input type=\"checkbox\" /></td></tr><tr><td><b>Enable post previews on hover</b></td><td><input type=\"checkbox\" /></td></tr></table><div class=\"lightbox-footer\"><hr /><button id=\"save-settings-button\">Save Settings</button></div>"

 	settings_menu = new TopBarButton("Settings",function(){
 		showLightBox("Settings",settings_html,null)
 	});
 	watched_threads_btn = new TopBarButton("WT",function() {});

 	if(current_staff.rank > 0) {
 		staff_btn = new DropDownMenu("Staff",getStaffMenuHTML())
 		$jq("a#staff.dropdown-button").click(function() {
 			$jq("a.staffmenu-item").click(function() {
	 			var url = $jq(this).attr("id");
				openStaffLightBox(url)
	 		});
 		});
 		addStaffButtons();
 	}

	if(isFrontPage()) changeFrontPage(getHashVal());
	else prepareThumbnails();

	$jq(".plus").click(function() {
		var block = $jq(this).parent().next();
		if(block.css("display") == "none") {
			block.show();
			$jq(this).html("-");
		} else {
			block.hide();
			$jq(this).html("+");
		}
	});
	thread_menu_open = false;
	$jq(".thread-ddown a, body").click(function(e) {
		e.stopPropagation();
		var post_id = $jq(this).parent().parent().parent().attr("id")
		var is_op = $jq(this).parent().parent().parent().attr("class") == "thread"
		
		if(post_id != undefined) {
			if($jq(this).parent().find("div.thread-ddown-menu").length == 0) {
				$jq("div.thread-ddown-menu").remove();

				menu_html = "<div class=\"thread-ddown-menu\" id=\""+post_id+"\">";
				if(!is_op) menu_html += "<ul><li><a href=\"javascript:hidePost("+post_id+");\" class=\"hide-post\">Show/Hide post</a></li>";
				menu_html +="<li><a href=\"javascript:deletePost("+post_id+");\" class=\"delete-post\">Delete post</a></li>" +
					"<li><a href=\"javascript:reportPost("+post_id+");\" class=\"report-post\">Report Post</a></li></ul>" +
					"</div>";

				$jq(this).parent().append(menu_html);
				thread_menu_open = true;
			} else {
				$jq("div.thread-ddown-menu").remove();
				thread_menu_open = false;
			}
		}
	});
});