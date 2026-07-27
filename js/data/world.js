(function(U){
  U.cities=[
    {name:'Valdoria',x:0,y:0,style:'Gran ciudad de piedra clara con barrios, plazas y talleres separados.',law:'Nigromancia prohibida',color:'#8b8069',floor:'#776f60',safe:24},
    {name:'Brumaférrea',x:150,y:-92,style:'Ciudad minera de hierro ennegrecido, hornos y murallas de basalto.',law:'Magia regulada',color:'#594f48',floor:'#514b47',safe:20}
  ];
  U.terrain={size:280,
    water:[{x:45,y:42,r:14},{x:104,y:-42,r:11},{x:-58,y:-18,r:12}],
    mines:[{x:46,y:-36,r:9},{x:128,y:-76,r:10},{x:-62,y:54,r:8},{x:166,y:-108,r:18,rich:true,name:'Mina Escuela de Brumaférrea'}],
    forests:[{x:-48,y:18,r:18},{x:78,y:-22,r:20},{x:52,y:72,r:17},{x:-85,y:-52,r:16}],
    dungeons:[
      {name:'Cementerio de los Susurros',x:58,y:-48,friendly:false,desc:'Zona exterior de no muertos, encargos y cofres.'},
      {name:'Cripta del Eco',x:70,y:-60,friendly:false,boss:true,desc:'Mazmorra de progresión con guardián y botín exclusivo.'},
      {name:'Torre del Umbral',x:118,y:18,friendly:false,boss:true,desc:'Zona de criaturas Notables.'}
    ],
    roads:[
      [[0,0],[28,-18],[58,-48],[70,-60]],
      [[0,0],[42,-12],[88,-40],[122,-70],[150,-92]],
      [[0,0],[-34,18],[-62,54]]
    ],
    stations:[
      {type:'forge',name:'Forja de Valdoria',x:10,y:8},
      {type:'carpentry',name:'Banco de carpintería',x:-10,y:9},
      {type:'alchemy',name:'Mesa de alquimia',x:9,y:-10},
      {type:'tailoring',name:'Mesa de costura',x:-10,y:-9},
      {type:'forge',name:'Forja de Brumaférrea',x:158,y:-86},
      {type:'forge',name:'Forja de la Mina Escuela',x:164,y:-105},
      {type:'tailoring',name:'Taller de Brumaférrea',x:141,y:-101}
    ]
  };
})(window.Ultra=window.Ultra||{});
