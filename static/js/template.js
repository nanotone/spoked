function instantiate($tpl) {
	var $instance = $tpl.clone().removeClass('template').attr('id', null).css({display: ''});
	$tpl.parent().append($instance);
	return $instance;
}
