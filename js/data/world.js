(function(U){
  U.cities=[
    {name:'Valdoria',x:0,y:0,style:'Piedra clara, tejados oscuros y plazas amuralladas.',law:'Nigromancia prohibida',color:'#786a50',safe:12},
    {name:'Brumaférrea',x:88,y:-54,style:'Ciudad minera de hierro ennegrecido, hornos y murallas de basalto.',law:'Magia regulada',color:'#594f48',safe:11}
  ];
  U.terrain={size:130,
    water:[{x:28,y:18,r:9},{x:63,y:-22,r:7}],
    mines:[{x:18,y:-15,r:6},{x:76,y:-45,r:6}],
    forests:[{x:-20,y:3,r:10},{x:48,y:-12,r:12}],
    dungeons:[{name:'Cripta del Eco',x:34,y:-27,friendly:true,desc:'Mazmorra de aprendizaje.'},{name:'Torre del Umbral',x:70,y:4,friendly:false,boss:true,desc:'Zona de criaturas Notables.'}],
    roads:[[[0,0],[20,-8],[45,-20],[67,-38],[88,-54]]],
    stations:[{type:'forge',name:'Yunque de Valdoria',x:4,y:2},{type:'carpentry',name:'Banco de carpintería',x:-4,y:3},{type:'alchemy',name:'Mesa de alquimia',x:2,y:-4},{type:'tailoring',name:'Mesa de costura',x:-3,y:-3}]
  };
})(window.Ultra=window.Ultra||{});