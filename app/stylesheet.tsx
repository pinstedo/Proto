import { StyleSheet } from "react-native";
export const styles = StyleSheet.create({

    /*bnext: {
    marginTop:"auto",
    textAlign:"center",
    backgroundColor:"#000000ff",
    borderRadius:"20",
    //titlecolor:"#FFFFFF",
    fontWeight:"bold",
    width:100,

  },*/
  container: {
    flex: 1,
    padding: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    //alignItems:"center",
    //alignSelf:"auto",
    //verticalAlign: 'middle',
    itemalign:"center",
    width:200, 
    height:200,
    marginTop:20,
    marginLeft:"auto",
    marginRight:"auto",
  },
  em: {
    textAlign:"center",
    //verticalAlign: 'middle',  
    textAlignVertical: 'bottom',
    fontFamily: 'italic',
    //fontWeight: 'bold',
    fontSize:18,
    color: '#b6a397ff',
    //textShadowColor: 'rgba(74, 16, 16, 0.75)',
    marginTop: 5,
  },
  head1:{

    fontSize:32,
    fontWeight:"bold",
    textAlign:"center",
    //marginTop:50,
  },
   head:{
    fontSize:25,
    fontWeight:"bold",
    textAlign:"center",
    marginTop:10,
  },
  buttonText: {
  color: "#F54927",
  fontSize: 18,
  fontWeight: "bold",
  }
});