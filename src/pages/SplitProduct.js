import React, { Component } from 'react'
import {connect} from 'react-redux';
import * as mainActions from '../actions/mainActions';
import { geocodeByAddress, getLatLng } from 'react-places-autocomplete'
import { Link } from 'react-router-dom'

import AnnotatedSection from '../components/AnnotatedSection'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faUngroup from '@fortawesome/fontawesome-free-solid/faObjectUngroup'
import faWrench from '@fortawesome/fontawesome-free-solid/faWrench'

import CreateProduct from './Create'

import {
  Button,
  FormGroup,
} from 'reactstrap';

class SplitProduct extends Component {

  // TODO: get the product details to make sure we have the right information before showing the Update page
  // TODO: before actually updating the product, check if there is a newer version (i.e. someone else updated the product before us)

  constructor(props) {
    super(props)
    this.state = {
      address: '',
      customDataInputs: {}
    }
    this.onChange = (address) => this.setState({ address })
  }

  componentDidMount() {
    this.params = this.props.match.params;

    this.props.passageInstance.getProductCustomDataById(String(this.params.productId).valueOf(), this.params.versionId ? String(this.params.versionId).valueOf() : "latest")
      .then((result) => {
        const customData = JSON.parse(result);
        Object.keys(customData).map(dataKey => {
          const inputKey = this.appendInput();
          return this.setState({
            customDataInputs: {...this.state.customDataInputs, [inputKey]: {key: dataKey, value: customData[dataKey]}}
          })
        })
      })
      .catch((error) => {
        this.setState({
          customDataJson: ""
        })
      })
  }

  appendInput() {
    var newInputKey = `input-${Object.keys(this.state.customDataInputs).length}`; // this might not be a good idea (e.g. when removing then adding more inputs)
    this.setState({ customDataInputs: {...this.state.customDataInputs, [newInputKey]: {key: "", value: ""} }});
    return newInputKey;
  }

  handleSelect = (address) => {
    this.setState({ address })

    geocodeByAddress(this.state.address)
      .then(results => getLatLng(results[0]))
      .then(latLng => {
        // TODO: disable the "update" button until a lat/long is returned from the Google Maps API
        return this.props.dispatch(mainActions.updateLatLng(latLng))
      })
      .catch(error => console.error('Error', error))
  }

  handleUpdateProduct = () => {

    var customDataObject = {}
    Object.keys(this.state.customDataInputs).map(inputKey => {
      return customDataObject[this.state.customDataInputs[inputKey].key] = this.state.customDataInputs[inputKey].value;
    })

    this.props.passageInstance.updateProduct(String(this.params.productId).valueOf(), this.props.latitude.toString(), this.props.longitude.toString(), JSON.stringify(customDataObject), {from: this.props.web3Accounts[0], gas:1000000})
      .then((result) => {
        // redirect to the product page
        return this.props.history.push('/products/' + this.params.productId);
      })
  }

  render() {
    return (
      <div>
        {/* Section des produits */}
        <AnnotatedSection
          annotationContent={
            <div>
              <FontAwesomeIcon fixedWidth style={{paddingTop:"3px", marginRight:"6px"}} icon={faUngroup}/>
              Produits dérivés
            </div>
          }
          panelContent={
            <div>
              <FormGroup>
                {
                  <CreateProduct/>
                }
                <Link to="#" onClick={ () => this.appendInput() }>
                  Ajouter un produit dérivé
                </Link>
              </FormGroup>
            </div>
          }
        />

        {/* Section des actions */}
        <AnnotatedSection
          annotationContent={
            <div>
              <FontAwesomeIcon fixedWidth style={{paddingTop:"3px", marginRight:"6px"}} icon={faWrench}/>
              Actions
            </div>
          }
          panelContent={
            <div>
              <Button color="primary" onClick={this.handleCreateNewProduct}>Effectuer la séparation</Button>
            </div>
          }
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    passageInstance: state.temporaryGodReducer.passageInstance,
    products: state.temporaryGodReducer.products,
    web3Accounts: state.temporaryGodReducer.web3Accounts,
    name: state.temporaryGodReducer.name,
    description: state.temporaryGodReducer.description,
    latitude: state.temporaryGodReducer.latitude,
    longitude: state.temporaryGodReducer.longitude,
  };
}

export default connect(mapStateToProps)(SplitProduct);