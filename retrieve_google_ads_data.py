#!/usr/bin/env python3
"""
Google Ads Data Retrieval Script
Retrieves comprehensive data from Google Ads account including campaigns, ad groups, ads, and keywords.
"""

import os
import sys
import json
import argparse
from datetime import datetime, timedelta
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException


def generate_refresh_token(config_path='google-ads.yaml'):
    """
    Generate OAuth2 refresh token interactively.
    This needs to be run once to get the refresh token.
    """
    print("\n=== Google Ads OAuth2 Token Generator ===\n")

    # Try to read from config file
    try:
        import yaml
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
            client_id = config.get('client_id', '')
            client_secret = config.get('client_secret', '')

        if not client_id or 'INSERT' in client_id:
            print("❌ Client ID not found in config file")
            print("Please add your client_id to google-ads.yaml first")
            return

        if not client_secret or 'INSERT' in client_secret:
            print("❌ Client Secret not found in config file")
            print("Please add your client_secret to google-ads.yaml first")
            return

        print(f"Using Client ID from config: {client_id}")

    except Exception as e:
        print(f"❌ Error reading config: {str(e)}")
        return

    try:
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow

        # OAuth2 scopes for Google Ads
        SCOPES = ['https://www.googleapis.com/auth/adwords']

        # Create OAuth2 flow
        flow = InstalledAppFlow.from_client_config(
            {
                "installed": {
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uris": ["http://localhost", "urn:ietf:wg:oauth:2.0:oob"],
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://accounts.google.com/o/oauth2/token"
                }
            },
            scopes=SCOPES
        )

        print("\n🌐 Opening browser for Google OAuth authorization...")
        print("Please authorize the application in your browser.\n")

        # Run local server to handle OAuth callback
        credentials = flow.run_local_server(port=8080)

        print(f"\n✅ Success! Your refresh token is:\n")
        print(f"{credentials.refresh_token}\n")
        print("Add this to your google-ads.yaml file under 'refresh_token'")

        # Optionally auto-update the config file
        print("\nWould you like to automatically update google-ads.yaml? (This will be skipped in non-interactive mode)")

    except Exception as e:
        print(f"\n❌ Error generating token: {str(e)}")
        print("\nMake sure you:")
        print("- Created OAuth2 credentials in Google Cloud Console")
        print("- Added http://localhost:8080 as an authorized redirect URI")
        print("- Enabled the Google Ads API")
        import traceback
        traceback.print_exc()


def load_config(config_path='google-ads.yaml'):
    """Load Google Ads API configuration from YAML file."""
    if not os.path.exists(config_path):
        print(f"❌ Configuration file not found: {config_path}")
        print(f"Please create {config_path} with your Google Ads credentials")
        sys.exit(1)

    try:
        return GoogleAdsClient.load_from_storage(config_path)
    except Exception as e:
        print(f"❌ Error loading configuration: {str(e)}")
        print("\nMake sure your google-ads.yaml has:")
        print("- developer_token")
        print("- client_id")
        print("- client_secret")
        print("- refresh_token")
        print("- login_customer_id")
        sys.exit(1)


def get_accessible_customers(client):
    """Get list of customer IDs accessible by this account."""
    customer_service = client.get_service("CustomerService")

    try:
        accessible_customers = customer_service.list_accessible_customers()
        return accessible_customers.resource_names
    except GoogleAdsException as ex:
        print(f"❌ Error retrieving accessible customers: {ex}")
        return []


def get_campaigns(client, customer_id):
    """Retrieve all campaigns with their details."""
    ga_service = client.get_service("GoogleAdsService")

    query = """
        SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign.advertising_channel_type,
            campaign.advertising_channel_sub_type,
            campaign.start_date,
            campaign.end_date,
            campaign.bidding_strategy_type,
            campaign.budget,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value,
            metrics.average_cpc,
            metrics.average_cpm,
            metrics.ctr
        FROM campaign
        WHERE campaign.status != 'REMOVED'
        ORDER BY campaign.id
    """

    campaigns = []
    try:
        stream = ga_service.search_stream(customer_id=customer_id, query=query)

        for batch in stream:
            for row in batch.results:
                campaign = {
                    'id': row.campaign.id,
                    'name': row.campaign.name,
                    'status': row.campaign.status.name,
                    'type': row.campaign.advertising_channel_type.name,
                    'sub_type': row.campaign.advertising_channel_sub_type.name,
                    'start_date': row.campaign.start_date,
                    'end_date': row.campaign.end_date,
                    'bidding_strategy': row.campaign.bidding_strategy_type.name,
                    'budget': row.campaign.budget,
                    'metrics': {
                        'impressions': row.metrics.impressions,
                        'clicks': row.metrics.clicks,
                        'cost': row.metrics.cost_micros / 1_000_000,
                        'conversions': row.metrics.conversions,
                        'conversion_value': row.metrics.conversions_value,
                        'avg_cpc': row.metrics.average_cpc / 1_000_000 if row.metrics.average_cpc else 0,
                        'avg_cpm': row.metrics.average_cpm / 1_000_000 if row.metrics.average_cpm else 0,
                        'ctr': round(row.metrics.ctr * 100, 2) if row.metrics.ctr else 0
                    }
                }
                campaigns.append(campaign)

        print(f"✅ Retrieved {len(campaigns)} campaigns")
        return campaigns

    except GoogleAdsException as ex:
        print(f"❌ Error retrieving campaigns: {ex}")
        return []


def get_ad_groups(client, customer_id, campaign_id=None):
    """Retrieve all ad groups with their details."""
    ga_service = client.get_service("GoogleAdsService")

    campaign_filter = f"AND campaign.id = {campaign_id}" if campaign_id else ""

    query = f"""
        SELECT
            ad_group.id,
            ad_group.name,
            ad_group.status,
            ad_group.type,
            campaign.id,
            campaign.name,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr
        FROM ad_group
        WHERE ad_group.status != 'REMOVED'
        {campaign_filter}
        ORDER BY campaign.id, ad_group.id
    """

    ad_groups = []
    try:
        stream = ga_service.search_stream(customer_id=customer_id, query=query)

        for batch in stream:
            for row in batch.results:
                ad_group = {
                    'id': row.ad_group.id,
                    'name': row.ad_group.name,
                    'status': row.ad_group.status.name,
                    'type': row.ad_group.type_.name,
                    'campaign_id': row.campaign.id,
                    'campaign_name': row.campaign.name,
                    'metrics': {
                        'impressions': row.metrics.impressions,
                        'clicks': row.metrics.clicks,
                        'cost': row.metrics.cost_micros / 1_000_000,
                        'conversions': row.metrics.conversions,
                        'ctr': round(row.metrics.ctr * 100, 2) if row.metrics.ctr else 0
                    }
                }
                ad_groups.append(ad_group)

        print(f"✅ Retrieved {len(ad_groups)} ad groups")
        return ad_groups

    except GoogleAdsException as ex:
        print(f"❌ Error retrieving ad groups: {ex}")
        return []


def get_ads(client, customer_id, campaign_id=None):
    """Retrieve all ads with their details."""
    ga_service = client.get_service("GoogleAdsService")

    campaign_filter = f"AND campaign.id = {campaign_id}" if campaign_id else ""

    query = f"""
        SELECT
            ad_group_ad.ad.id,
            ad_group_ad.ad.name,
            ad_group_ad.ad.type,
            ad_group_ad.ad.final_urls,
            ad_group_ad.status,
            ad_group.id,
            ad_group.name,
            campaign.id,
            campaign.name,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions
        FROM ad_group_ad
        WHERE ad_group_ad.status != 'REMOVED'
        {campaign_filter}
        ORDER BY campaign.id, ad_group.id
    """

    ads = []
    try:
        stream = ga_service.search_stream(customer_id=customer_id, query=query)

        for batch in stream:
            for row in batch.results:
                ad = {
                    'id': row.ad_group_ad.ad.id,
                    'name': row.ad_group_ad.ad.name,
                    'type': row.ad_group_ad.ad.type_.name,
                    'final_urls': list(row.ad_group_ad.ad.final_urls),
                    'status': row.ad_group_ad.status.name,
                    'ad_group_id': row.ad_group.id,
                    'ad_group_name': row.ad_group.name,
                    'campaign_id': row.campaign.id,
                    'campaign_name': row.campaign.name,
                    'metrics': {
                        'impressions': row.metrics.impressions,
                        'clicks': row.metrics.clicks,
                        'cost': row.metrics.cost_micros / 1_000_000,
                        'conversions': row.metrics.conversions
                    }
                }
                ads.append(ad)

        print(f"✅ Retrieved {len(ads)} ads")
        return ads

    except GoogleAdsException as ex:
        print(f"❌ Error retrieving ads: {ex}")
        return []


def get_keywords(client, customer_id, campaign_id=None):
    """Retrieve all keywords with their details."""
    ga_service = client.get_service("GoogleAdsService")

    campaign_filter = f"AND campaign.id = {campaign_id}" if campaign_id else ""

    query = f"""
        SELECT
            ad_group_criterion.criterion_id,
            ad_group_criterion.keyword.text,
            ad_group_criterion.keyword.match_type,
            ad_group_criterion.status,
            ad_group_criterion.negative,
            ad_group_criterion.final_urls,
            ad_group.id,
            ad_group.name,
            campaign.id,
            campaign.name,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr,
            metrics.average_cpc
        FROM keyword_view
        WHERE ad_group_criterion.status != 'REMOVED'
        {campaign_filter}
        ORDER BY campaign.id, ad_group.id
    """

    keywords = []
    try:
        stream = ga_service.search_stream(customer_id=customer_id, query=query)

        for batch in stream:
            for row in batch.results:
                keyword = {
                    'id': row.ad_group_criterion.criterion_id,
                    'text': row.ad_group_criterion.keyword.text,
                    'match_type': row.ad_group_criterion.keyword.match_type.name,
                    'status': row.ad_group_criterion.status.name,
                    'negative': row.ad_group_criterion.negative,
                    'final_urls': list(row.ad_group_criterion.final_urls) if row.ad_group_criterion.final_urls else [],
                    'ad_group_id': row.ad_group.id,
                    'ad_group_name': row.ad_group.name,
                    'campaign_id': row.campaign.id,
                    'campaign_name': row.campaign.name,
                    'metrics': {
                        'impressions': row.metrics.impressions,
                        'clicks': row.metrics.clicks,
                        'cost': row.metrics.cost_micros / 1_000_000,
                        'conversions': row.metrics.conversions,
                        'ctr': round(row.metrics.ctr * 100, 2) if row.metrics.ctr else 0,
                        'avg_cpc': row.metrics.average_cpc / 1_000_000 if row.metrics.average_cpc else 0
                    }
                }
                keywords.append(keyword)

        print(f"✅ Retrieved {len(keywords)} keywords")
        return keywords

    except GoogleAdsException as ex:
        print(f"❌ Error retrieving keywords: {ex}")
        return []


def main():
    parser = argparse.ArgumentParser(description='Retrieve Google Ads data')
    parser.add_argument('--generate-token', action='store_true',
                       help='Generate OAuth2 refresh token')
    parser.add_argument('--config', default='google-ads.yaml',
                       help='Path to configuration file (default: google-ads.yaml)')
    parser.add_argument('--output', default='google-ads-data.json',
                       help='Output file path (default: google-ads-data.json)')
    parser.add_argument('--customer-id', help='Specific customer ID to query')

    args = parser.parse_args()

    # Generate token if requested
    if args.generate_token:
        generate_refresh_token()
        return

    # Load configuration
    print("\n=== Google Ads Data Retrieval ===\n")
    print("Loading configuration...")
    client = load_config(args.config)

    # Get customer ID
    if args.customer_id:
        customer_id = args.customer_id.replace('-', '')
    else:
        # Try to get from config
        try:
            with open(args.config, 'r') as f:
                import yaml
                config = yaml.safe_load(f)
                customer_id = config.get('login_customer_id', '').replace('-', '')
        except:
            print("❌ Could not determine customer ID")
            print("Please provide --customer-id or set login_customer_id in config")
            sys.exit(1)

    print(f"Using customer ID: {customer_id}\n")

    # Retrieve all data
    print("Retrieving campaigns...")
    campaigns = get_campaigns(client, customer_id)

    print("\nRetrieving ad groups...")
    ad_groups = get_ad_groups(client, customer_id)

    print("\nRetrieving ads...")
    ads = get_ads(client, customer_id)

    print("\nRetrieving keywords...")
    keywords = get_keywords(client, customer_id)

    # Compile results
    results = {
        'retrieved_at': datetime.now().isoformat(),
        'customer_id': customer_id,
        'summary': {
            'total_campaigns': len(campaigns),
            'total_ad_groups': len(ad_groups),
            'total_ads': len(ads),
            'total_keywords': len(keywords)
        },
        'campaigns': campaigns,
        'ad_groups': ad_groups,
        'ads': ads,
        'keywords': keywords
    }

    # Save to file
    with open(args.output, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n✅ Data saved to {args.output}")
    print(f"\nSummary:")
    print(f"  - {len(campaigns)} campaigns")
    print(f"  - {len(ad_groups)} ad groups")
    print(f"  - {len(ads)} ads")
    print(f"  - {len(keywords)} keywords")

    # Print campaign summary
    if campaigns:
        print(f"\nCampaigns:")
        for campaign in campaigns:
            status_icon = "🟢" if campaign['status'] == 'ENABLED' else "🔴"
            print(f"  {status_icon} {campaign['name']} (ID: {campaign['id']})")
            print(f"     Type: {campaign['type']}, Status: {campaign['status']}")
            print(f"     Impressions: {campaign['metrics']['impressions']:,}")
            print(f"     Clicks: {campaign['metrics']['clicks']:,}")
            print(f"     Cost: ${campaign['metrics']['cost']:,.2f}")
            print(f"     CTR: {campaign['metrics']['ctr']}%")
            print()


if __name__ == '__main__':
    main()
